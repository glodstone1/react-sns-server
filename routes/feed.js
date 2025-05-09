const express = require('express')
const db = require('../db')
const router = express.Router();
const authMiddleware = require('./auth'); // 중간에서 토큰 검증하는 함수

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
    let {feedId} = req.body;
    const files = req.files;
    // const filename = req.file.filename; 
    // const destination = req.file.destination; 
    try{
        let results = [];
        for(let file of files){
            let filename = file.filename;
            let destination = file.destination; 
            let query = "INSERT INTO TBL_FEED_IMG VALUES(NULL, ?, ?, ?)";
            let result = await db.query(query, [feedId, filename, destination]);
            results.push(result);
        }
        res.json({
            message : "result",
            result : results
        });

    } catch(err){
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
});


//api
// router.get("/", async (req, res) => {  // 7.async로 동기화 
//     try {
//         let sql = "SELECT * FROM TBL_FEED";
//         let [list] = await db.query(sql); // 4 ,6 list에 [] 붙이고 await 써주기
//         res.json({
//             message: "result",
//             list: list
//         }); // 5
//     } catch (err) {
//         console.log("에러 발생!");
//         res.status(500).send("Server Error");
//     }
// })

router.get("/", async (req, res) => {  // 7.async로 동기화 
    // 재사용성이 좋게 만들자
    let { userId } = req.query;
    try {
        let sql = "SELECT * FROM TBL_FEED";
        let imgSql = "SELECT * FROM TBL_FEED F "
                    + "INNER JOIN TBL_FEED_IMG I ON F.ID = I.FEEDID";
        if(userId){
            sql += " WHERE USERID = '" + userId + "'";
            imgSql += " WHERE USERID = '" + userId + "'";
        }
        
        let [list] = await db.query(sql); // 4 ,6 list에 [] 붙이고 await 써주기
        let [imgList] = await db.query(imgSql);
        res.json({
            message: "result",
            list: list,
            imgList : imgList
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { userId , content } = req.body;
    try {
        let query = "INSERT INTO TBL_FEED VALUES(NULL,?,?,NOW())"; // 4 ,6 list에 [] 붙이고 await 써주기
        let result = await db.query(query, [userId, content])
        console.log("result====>",result);
        res.json({
            message : "result",
            result : result[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.delete("/:id",authMiddleware, async (req, res) => { 
    let { id } = req.params;
    console.log(id);
    try {
        let result = await db.query("DELETE FROM TBL_FEED WHERE ID=" + id);
        res.json({
            message: "result",
            result : result

        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
      let sql = "SELECT * FROM TBL_FEED WHERE ID=?";
      let [list] = await db.query(sql, [id]);
      res.json({ 
        
       feed :list[0] });
    } catch (err) {
      res.status(500).send("Server Error");
    }
  });

  router.put("/:id", async (req, res) => {
    let { id } = req.params;
    let { userId , content } = req.body;
    try {
        let query = "UPDATE TBL_FEED SET USERID = ?, CONTENT = ? WHERE ID=?";
        let [list] = await db.query(query, [userId , content, id])
        res.json({
            message: "수정됨",
            list: list
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})




module.exports = router