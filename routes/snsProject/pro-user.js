const express = require('express');
const db = require('../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../auth');

// JWT 설정
const JWT_KEY = "show-me-the-money";

// 로그인
router.post("/", async (req, res) => {
  let { email, pwd } = req.body;
  try {
    let query = "SELECT USER_EMAIL, PWD, USER_NAME, NICK_NAME, INTRO, PROFILE_IMG, ROLE FROM pro_users WHERE USER_EMAIL = ?";
    let [proUser] = await db.query(query, [email]);
    let result = {};

    if (proUser.length > 0) {
      let isMatch = await bcrypt.compare(pwd, proUser[0].PWD);
      if (isMatch) {
        let payload = {
          email: proUser[0].USER_EMAIL,
          userName: proUser[0].USER_NAME,
          nickName: proUser[0].NICK_NAME,
          role: proUser[0].ROLE
        };
        const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });
        result = {
          message: proUser[0].USER_NAME + "님, 환영합니다",
          success: true,
          token: token
        };
      } else {
        result = { message: "비밀번호 확인하세요", success: false };
      }
    } else {
      result = { message: "아이디 확인하세요" };
    }

    res.json(result);
  } catch (err) {
    console.log("에러 발생!", err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/follow-list", authMiddleware, async (req, res) => {
  const { type = "following", email, keyword = "" } = req.query;
  const userEmail = email || req.user.email;
  const likeKeyword = `%${keyword}%`;

  const isFollowing = type === "following";

  const joinColumn = isFollowing ? "F.FOLLOWED_EMAIL" : "F.FOLLOWING_EMAIL";
  const whereColumn = isFollowing ? "F.FOLLOWING_EMAIL" : "F.FOLLOWED_EMAIL";

  const query =
    "SELECT U.USER_EMAIL, U.NICK_NAME, U.PROFILE_IMG " +
    "FROM PRO_USERS U " +
    `JOIN PRO_FOLLOW F ON U.USER_EMAIL = ${joinColumn} ` +
    `WHERE ${whereColumn} = ? ` +
    "AND F.CANCEL_YN = 'N' " +
    "AND (U.NICK_NAME LIKE ? OR U.USER_EMAIL LIKE ?) " +
    "ORDER BY U.NICK_NAME ASC";

  try {
    const [rows] = await db.query(query, [userEmail, likeKeyword, likeKeyword]);
    res.json(rows);
  } catch (err) {
    console.error("팔로우/팔로워 조회 실패:", err);
    res.status(500).send("팔로우 목록 조회 실패");
  }
});

// ✅ 추천 유저 조회
router.get("/suggested-users", authMiddleware, async (req, res) => {
  const userEmail = req.user.email;
  const limitParam = req.query.limit || '6';
  const keyword = req.query.keyword || '';

  const baseQuery =
    "SELECT USER_EMAIL, NICK_NAME, PROFILE_IMG " +
    "FROM PRO_USERS " +
    "WHERE USER_EMAIL != ? " +
    "AND USER_EMAIL NOT IN ( " +
      "SELECT FOLLOWED_EMAIL " +
      "FROM PRO_FOLLOW " +
      "WHERE FOLLOWING_EMAIL = ? AND CANCEL_YN = 'N' " +
    ") " +
    "AND (NICK_NAME LIKE ? OR USER_EMAIL LIKE ?)";

  const limitClause =
    (limitParam && limitParam !== 'all')
      ? " ORDER BY RAND() LIMIT ?"
      : " ORDER BY RAND()";

  const query = baseQuery + limitClause;

  try {
    const likeKeyword = `%${keyword}%`;
    const params = [userEmail, userEmail, likeKeyword, likeKeyword];

    if (limitParam !== 'all') {
      params.push(parseInt(limitParam));
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("추천 유저 검색 실패:", err);
    res.status(500).send("추천 유저 검색 실패");
  }
});

// ✅ 마이페이지 통계
router.get("/mypage-stat", async (req, res) => {
  const { email } = req.query;
  try {
    const [result] = await db.query(
      "SELECT " +
      "(SELECT COUNT(*) FROM PRO_FOLLOW WHERE FOLLOWING_EMAIL = ? AND CANCEL_YN = 'N') AS following_count, " +
      "(SELECT COUNT(*) FROM PRO_FOLLOW WHERE FOLLOWED_EMAIL = ? AND CANCEL_YN = 'N') AS follower_count, " +
      "(SELECT COUNT(*) FROM PRO_POSTS WHERE USER_EMAIL = ?) AS post_count",
      [email, email, email]
    );
    res.json({
      message: "mypage stats",
      follower_count: result[0].follower_count,
      following_count: result[0].following_count,
      post_count: result[0].post_count
    });
  } catch (err) {
    console.error("마이페이지 통계 에러:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ 게시글 목록
router.get("/posts", async (req, res) => {
  const { email } = req.query;
  try {
    const query = `
      SELECT P.POST_ID, P.POST_TITLE, P.POST_CONTENT, P.CDATE_TIME, P.POST_TYPE, I.IMG_NAME, I.IMG_PATH
      FROM PRO_POSTS P
      LEFT JOIN PRO_POSTS_IMG I ON P.POST_ID = I.POST_ID AND I.THUMBNAIL_YN = 'Y'
      WHERE P.USER_EMAIL = ?
      ORDER BY P.CDATE_TIME DESC
    `;
    const [posts] = await db.query(query, [email]);
    res.json({
      message: "user posts",
      posts: posts
    });
  } catch (err) {
    console.error("게시글 목록 조회 에러:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ 프로필 이미지 업로드
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  let { email } = req.body;
  const filename = req.file.filename;
  const destination = req.file.destination;
  try {
    let query = "UPDATE PRO_USERS SET PROFILE_IMG = ? WHERE USER_EMAIL = ?";
    let result = await db.query(query, [destination + filename, email]);
    res.json({
      message: "result",
      result: result
    });
  } catch (err) {
    console.log("에러 발생!", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ 회원가입
router.post("/join", async (req, res) => {
  let { email, pwd, userName, nickName, intro, fearType } = req.body;
  try {
    let hashPwd = await bcrypt.hash(pwd, 10);
    let query = "INSERT INTO pro_users VALUES(?,?,?,?,?,NULL,?,'USER',NOW(),NULL,'N',NULL);";
    let [proUser] = await db.query(query, [email, hashPwd, userName, nickName, intro, fearType]);
    res.json({
      message: "가입 완료",
      result: "success"
    });
  } catch (err) {
    console.log("에러 발생!", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ 마지막에 위치: 동적 라우트 (특정 유저 조회)
router.get("/:email", async (req, res) => {
  let { email } = req.params;
  try {
    let [list] = await db.query("SELECT * FROM PRO_USERS WHERE USER_EMAIL = ?", [email]);
    res.json({
      message: "result",
      info: list[0]
    });
  } catch (err) {
    console.log("에러 발생!", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;