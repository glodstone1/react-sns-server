const express = require('express')
const db = require('../../db')
const router = express.Router();
const authMiddleware = require('../auth');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ 이미지 업로드 시 이전 썸네일 초기화
router.post('/upload', upload.array('file'), async (req, res) => {
    let { feedId } = req.body;
    const files = req.files;
    try {
        let results = [];
        let thumbnail = "Y";

        await db.query("UPDATE PRO_POSTS_IMG SET THUMBNAIL_YN = 'N' WHERE POST_ID = ?", [feedId]);

        for (let file of files) {
            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO PRO_POSTS_IMG VALUES(NULL, ?, ?, ?, ?,NULL)";
            let result = await db.query(query, [feedId, filename, destination, thumbnail]);
            results.push(result);
            thumbnail = "N";
        }
        res.json({ message: "result", result: results });

    } catch (err) {
        console.log("에러 발생!(업로드)");
        res.status(500).send("Server Error");
    }
});

router.post("/", async (req, res) => {
    let { email, title, type, content } = req.body;
    try {
        let query = "INSERT INTO PRO_POSTS VALUES (NULL,?,?,?,?,NOW(),NULL)";
        let result = await db.query(query, [email, title, type, content])
        res.json({ message: "result", result: result[0] });
    } catch (err) {
        console.log("에러 발생!(게시글 업로드)");
        res.status(500).send("Server Error");
    }
});

router.get("/list", async (req, res) => {
    try {
        let { type } = req.query;
        let sql = "SELECT P.POST_ID, P.USER_EMAIL, NICK_NAME, POST_TITLE, POST_TYPE, POST_CONTENT, P.CDATE_TIME, UDATE_TIME, POST_IMG_ID, IMG_NAME, IMG_PATH, THUMBNAIL_YN " +
            "FROM pro_posts P " +
            "LEFT JOIN pro_posts_img I ON P.POST_ID = I.POST_ID " +
            "LEFT JOIN pro_users U ON P.USER_EMAIL = U.USER_EMAIL " +
            "WHERE 1=1 ";

        if (type) sql += "AND POST_TYPE = ? ";
        sql += "AND (THUMBNAIL_YN = 'Y' OR THUMBNAIL_YN IS NULL) ";
        sql += "ORDER BY P.POST_ID DESC";

        let [list] = type ? await db.query(sql, [type]) : await db.query(sql);
        res.json({ message: "result", list: list });

    } catch (err) {
        console.log("에러 발생!(피드리스트)");
        res.status(500).send("Server Error");
    }
});

router.get("/:POST_ID", async (req, res) => {
    let { POST_ID } = req.params;
    try {
        let sql = "SELECT * FROM PRO_POSTS WHERE POST_ID = " + POST_ID;
        let imgSql = "SELECT * FROM PRO_POSTS_IMG WHERE POST_ID = " + POST_ID;
        let commSql = "SELECT COMMENT_ID, POST_ID, C.USER_EMAIL, CONTENT, USER_NAME, NICK_NAME, PROFILE_IMG, C.CDATE_TIME, PARENT_ID " +
            "FROM pro_comment C " +
            "INNER JOIN pro_users U ON C.USER_EMAIL = U.USER_EMAIL " +
            "WHERE POST_ID = " + POST_ID +
            " ORDER BY COMMENT_ID ASC";
        let [list] = await db.query(sql);
        let [imgList] = await db.query(imgSql);
        let [commList] = await db.query(commSql);
        res.json({ message: "result", feed: list[0], imgList: imgList, commList: commList });
    } catch (err) {
        console.log("에러 발생!(그림,글)");
        res.status(500).send("Server Error");
    }
});

// ✅ 게시글 이미지 목록 조회 API 추가
router.get("/:POST_ID/images", async (req, res) => {
    const { POST_ID } = req.params;
    try {
        const [rows] = await db.query("SELECT IMG_NAME, IMG_PATH, POST_IMG_ID FROM PRO_POSTS_IMG WHERE POST_ID = ?", [POST_ID]);
        res.json({ images: rows });
    } catch (err) {
        console.error("이미지 불러오기 에러:", err.message);
        res.status(500).send("Server Error");
    }
});

// ✅ 게시글 이미지 삭제 API 추가
router.delete("/image/:imgId", async (req, res) => {
    const { imgId } = req.params;

    try {
        // 1. 삭제 대상 이미지 정보 조회
        const [[imgInfo]] = await db.query("SELECT POST_ID, THUMBNAIL_YN FROM PRO_POSTS_IMG WHERE POST_IMG_ID = ?", [imgId]);

        if (!imgInfo) {
            return res.status(404).json({ message: "이미지를 찾을 수 없습니다." });
        }

        const postId = imgInfo.POST_ID;
        const wasThumbnail = imgInfo.THUMBNAIL_YN === 'Y';

        // 2. 이미지 삭제
        await db.query("DELETE FROM PRO_POSTS_IMG WHERE POST_IMG_ID = ?", [imgId]);

        // 3. 삭제된 이미지가 썸네일이라면, 남은 이미지 중 하나를 썸네일로 지정
        if (wasThumbnail) {
            const [[nextImg]] = await db.query(
                "SELECT POST_IMG_ID FROM PRO_POSTS_IMG WHERE POST_ID = ? ORDER BY POST_IMG_ID ASC LIMIT 1",
                [postId]
            );

            if (nextImg) {
                await db.query("UPDATE PRO_POSTS_IMG SET THUMBNAIL_YN = 'Y' WHERE POST_IMG_ID = ?", [nextImg.POST_IMG_ID]);
            }
        }

        res.json({ success: true, message: "이미지 삭제 완료" });

    } catch (err) {
        console.error("이미지 삭제 에러:", err.message);
        res.status(500).send("Server Error");
    }
});

router.post("/comment", async (req, res) => {
  let { postId, email, comment, parentId } = req.body;
  try {
    let query = "INSERT INTO pro_comment (POST_ID, USER_EMAIL, CONTENT, CDATE_TIME, PARENT_ID) VALUES (?, ?, ?, NOW(), ?)";
    let result = await db.query(query, [postId, email, comment, parentId || null]);

    // ✅ 게시글 작성자 이메일 조회
    let [postRows] = await db.query("SELECT USER_EMAIL FROM PRO_POSTS WHERE POST_ID = ?", [postId]);
    let postOwner = postRows[0]?.USER_EMAIL;

    // ✅ 댓글 작성자가 글쓴이가 아닐 경우 알림 생성
    if (postOwner && postOwner !== email) {
      // ✅ 닉네임 조회
      let [senderRows] = await db.query("SELECT NICK_NAME FROM PRO_USERS WHERE USER_EMAIL = ?", [email]);
      let senderNick = senderRows[0]?.NICK_NAME || "익명";

      // ✅ sender_email까지 포함한 알림 저장
      await db.query(
        "INSERT INTO PRO_NOTIFICATIONS (USER_EMAIL, SENDER_EMAIL, NOTI_TYPE, MESSAGE, TARGET_ID, IS_READ_YN, CDATE_TIME) " +
        "VALUES (?, ?, 'COMMENT', ?, ?, 'N', NOW())",
        [postOwner, email, `${senderNick}님이 댓글을 남겼습니다.`, postId]
      );
    }

    res.json({ message: "댓글이 작성되었습니다.", result: result[0] });
  } catch (err) {
    console.log("에러 발생!(댓글 확인)", err);
    res.status(500).send("Server Error");
  }
});

router.delete("/comment/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // 최상위 댓글 + 대댓글 모두 삭제
        const [result] = await db.query(
            "DELETE FROM pro_comment WHERE COMMENT_ID = ? OR PARENT_ID = ?",
            [id, id]
        );

        res.json({ success: true, message: "댓글 및 대댓글이 삭제되었습니다.", result });
    } catch (err) {
        console.error("댓글 삭제 오류:", err.message);
        res.status(500).send("Server Error");
    }
});


router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM PRO_POSTS_IMG WHERE POST_ID = ?", [id]);
        const [result] = await db.query("DELETE FROM PRO_POSTS WHERE POST_ID = ?", [id]);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: '게시글이 삭제되었습니다.' });
        } else {
            res.json({ success: false, message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
    } catch (err) {
        console.error('게시글 삭제 오류:', err.message);
        res.status(500).send('Server Error');
    }
});

router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, content, type } = req.body;
    try {
        let query = "UPDATE PRO_POSTS SET POST_TITLE = ?, POST_CONTENT = ?, POST_TYPE = ?, UDATE_TIME = NOW() WHERE POST_ID = ?";
        let [result] = await db.query(query, [title, content, type, id]);
        res.json({ message: "게시글이 수정되었습니다.", result });
    } catch (err) {
        console.error("게시글 수정 에러:", err.message);
        res.status(500).send("Server Error");
    }
});

router.put("/comment/:id", async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    try {
        const [result] = await db.query(
            "UPDATE pro_comment SET CONTENT = ?, CDATE_TIME = NOW() WHERE COMMENT_ID = ?",
            [content, id]
        );
        res.json({ success: true, message: "댓글 수정 완료", result });
    } catch (err) {
        console.error("댓글 수정 오류:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
