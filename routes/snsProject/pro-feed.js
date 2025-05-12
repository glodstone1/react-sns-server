const express = require('express')
const db = require('../../db')
const router = express.Router();
const authMiddleware = require('../auth'); // 중간에서 토큰 검증하는 함수

// 1. 패키지 추가
const multer = require('multer');

// 2. 저장 경로 및 파일명
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 3. api 호출
router.post('/upload', upload.array('file'), async (req, res) => {
    let { feedId } = req.body;
    const files = req.files;
    // const filename = req.file.filename; 
    // const destination = req.file.destination; 
    try {
        let results = [];
        let thumbnail = "Y";
        for (let file of files) {
            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO PRO_POSTS_IMG VALUES(NULL, ?, ?, ?, ?,NULL)";
            let result = await db.query(query, [feedId, filename, destination, thumbnail]);
            results.push(result);
            thumbnail = "N";
        }
        res.json({
            message: "result",
            result: results
        });

    } catch (err) {
        console.log("에러 발생!(업로드)");
        res.status(500).send("Server Error");
    }
});


router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { email, title, type, content } = req.body;
    try {
        let query = "INSERT INTO PRO_POSTS VALUES (NULL,?,?,?,?,NOW(),NULL)"; // 4 ,6 list에 [] 붙이고 await 써주기
        let result = await db.query(query, [email, title, type, content])
        console.log("result====>", result);
        res.json({
            message: "result",
            result: result[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!(게시글 업로드)");
        res.status(500).send("Server Error");
    }
})




router.get("/list", async (req, res) => {
    try {
        let { type } = req.query; // 예: /list?type=real
        // let type = "";

        let sql = "SELECT P.POST_ID, P.USER_EMAIL, NICK_NAME, POST_TITLE, POST_TYPE, POST_CONTENT, P.CDATE_TIME, UDATE_TIME, POST_IMG_ID, IMG_NAME, IMG_PATH, THUMBNAIL_YN "
            + "FROM pro_posts P "
            + "LEFT JOIN pro_posts_img I ON P.POST_ID = I.POST_ID "
            + "LEFT JOIN pro_users U ON P.USER_EMAIL = U.USER_EMAIL "
            + "WHERE 1=1 ";

        // ✅ type 값이 있을 경우에만 조건 추가
        if (type) {
            sql += "AND POST_TYPE = ? ";
        }

        sql += "AND (THUMBNAIL_YN = 'Y' OR THUMBNAIL_YN IS NULL) ";
        sql += "ORDER BY P.POST_ID DESC";

        // ✅ 조건값이 있는 경우만 ? 자리에 값을 넣어 전달
        let [list] = type
            ? await db.query(sql, [type])
            : await db.query(sql);

        res.json({
            message: "result",
            list: list
        });

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
        let commSql =
            "SELECT COMMENT_ID, POST_ID, C.USER_EMAIL, CONTENT, USER_NAME, NICK_NAME, PROFILE_IMG, C.CDATE_TIME, PARENT_ID " +
            "FROM pro_comment C " +
            "INNER JOIN pro_users U ON C.USER_EMAIL = U.USER_EMAIL " +
            "WHERE POST_ID = " + POST_ID +
            " ORDER BY COMMENT_ID ASC";
        let [list] = await db.query(sql);
        let [imgList] = await db.query(imgSql);
        let [commList] = await db.query(commSql);
        res.json({
            message: "result",
            feed: list[0],
            imgList: imgList,
            commList: commList
        });
    } catch (err) {
        console.log("에러 발생!(그림,글)");
        res.status(500).send("Server Error");
    }
})

// 댓글 등록
router.post("/comment", async (req, res) => {
    let { postId, email, comment, parentId } = req.body;

    try {
        let query =
            "INSERT INTO pro_comment " +
            "(POST_ID, USER_EMAIL, CONTENT, CDATE_TIME, PARENT_ID) " +
            "VALUES (?, ?, ?, NOW(), ?)";

        let result = await db.query(query, [
            postId,
            email,
            comment,
            parentId || null // 대댓글이 아니면 null로 처리
        ]);

        res.json({
            message: "댓글이 작성되었습니다.",
            result: result[0]
        });

    } catch (err) {
        console.log("에러 발생!(댓글 하기)", err);
        res.status(500).send("Server Error");
    }
});

// 게시글 삭제
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('포스트 넘버',id);

  try {
    // 1. 게시글 이미지 삭제 (선택사항: 실제 파일 삭제는 별도로 구현 가능)
    await db.query('DELETE FROM PRO_POSTS_IMG WHERE POST_ID = ?', [id]);

    // 2. 게시글 자체 삭제
    const [result] = await db.query('DELETE FROM PRO_POSTS WHERE POST_ID = ?', [id]);

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



module.exports = router