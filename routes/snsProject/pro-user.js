const express = require('express')
const db = require('../../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const jwt = require('jsonwebtoken'); // jwt 토큰
const router = express.Router();
const multer = require('multer'); // 파일 업로드



//토큰용 로그인
const JWT_KEY = "show-me-the-money"; // 키 임의로 만들기
router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { email, pwd } = req.body;
    console.log(email, pwd);
    // await bcrypt.compare(내가 입력한, db에 저장한 해시)
    // 리턴은 트루, 펄스
    try {
        let query = "SELECT USER_EMAIL, PWD, USER_NAME, NICK_NAME, INTRO, PROFILE_IMG, ROLE FROM pro_users WHERE USER_EMAIL = ?"; // 4 ,6 list에 [] 붙이고 await 써주기
        console.log(query);
        let [proUser] = await db.query(query, [email])
        let result = {};
        if (proUser.length > 0) {
            let isMatch = await bcrypt.compare(pwd, proUser[0].PWD); // 기재한 내 비번과 해시화 된 비번을 비교
            if (isMatch) {
                //jwt 토큰 생성
                let payload = {
                    email: proUser[0].USER_EMAIL,
                    userName: proUser[0].USER_NAME,
                    nickName: proUser[0].NICK_NAME,
                    role: proUser[0].ROLE
                };
                const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });
                console.log(payload);
                console.log(token);

                result = {
                    message: proUser[0].USER_NAME + "님, 환영합니다",
                    success: true,
                    //토큰 리턴
                    token: token
                    // token : token //키하고 밸류가 같으면 그냥 하나로 써도 무방
                };
            } else {
                result = {

                    message: "비밀번호 확인하세요",
                    success: false

                };
            }
            // 성공시 세션값 저장

        } else {
            result = {
                message: "아이디 확인하세요",

            };
        }
        res.json(result); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

//마이페이지 통계
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


router.get("/posts", async (req, res) => {
  const { email } = req.query;

  try {
    const [posts] = await db.query(`
      SELECT P.POST_ID,
        P.POST_TITLE,
        P.POST_CONTENT,
        P.CDATE_TIME,
        P.POST_TYPE,
        I.IMG_NAME,
        I.IMG_PATH
      FROM PRO_POSTS P
      LEFT JOIN PRO_POSTS_IMG I 
        ON P.POST_ID = I.POST_ID 
        AND I.THUMBNAIL_YN = 'Y'
      WHERE P.USER_EMAIL = ?
      ORDER BY P.CDATE_TIME DESC
    `, [email]);

    res.json({
      message: "user posts",
      posts: posts
    });

  } catch (err) {
    console.error("게시글 목록 조회 에러:", err.message);
    res.status(500).send("Server Error");
  }
});



router.get("/:email", async (req, res) => { // :productId 동적으로 처리하기
    let { email } = req.params;

    try {
        let [list] = await db.query("SELECT * FROM PRO_USERS WHERE USER_EMAIL= '" + email + "'");
        res.json({
            message: "result",
            info: list[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!", err.message);
        res.status(500).send("Server Error");
    }
})


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
    let { email } = req.body;
    console.log('이멜 넘어옴??',req.file);
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
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
});

// 회원 가입
router.post("/join", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { email, pwd, userName, nickName, intro, fearType } = req.body;

    try {
        let hashPwd = await bcrypt.hash(pwd, 10); //숫자 10 -> 해시화를 10번 반복하겠다
        let query = "INSERT INTO pro_users VALUES(?,?,?,?,?,NULL,?,'USER',NOW(),NULL,'N',NULL);"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [proUser] = await db.query(query, [email, hashPwd, userName, nickName, intro, fearType])
        res.json({
            message: "가입 완료",
            result : "success"
        })

    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})



module.exports = router;