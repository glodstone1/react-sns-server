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
    let {feedId} = req.body;
    const files = req.files;
    // const filename = req.file.filename; 
    // const destination = req.file.destination; 
    try{
        let results = [];
        let thumbnail = "Y";
        for(let file of files){
            let filename = file.filename;
            let destination = file.destination;
            let query = "INSERT INTO TBL_FEED_IMG VALUES(NULL, ?, ?, ?, ?)";
            let result = await db.query(query, [feedId, filename, destination, thumbnail]);
            results.push(result);
            thumbnail = "N";
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


router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { email, title, content } = req.body;
    try {
        let query = "INSERT INTO TBL_FEED VALUES(NULL,?,?,?,NOW())"; // 4 ,6 list에 [] 붙이고 await 써주기
        let result = await db.query(query, [email, title, content])
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

router.get("/", async (req, res) => { 
    try {
        let sql = "SELECT * FROM TBL_FEED F "
                + "INNER JOIN TBL_FEED_IMG I ON F.ID = I.FEEDID "
                + "WHERE THUMBNAILYN = 'Y'";  
        let [list] = await db.query(sql); 
        res.json({
            message: "result",
            list: list
        }); 
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/:id", async (req, res) => { 
    let { id } = req.params;
    try {
        let sql = "SELECT * FROM TBL_FEED WHERE ID = " + id;
        let imgSql = "SELECT * FROM TBL_FEED_IMG WHERE FEEDID = " + id;
        let [list] = await db.query(sql); 
        let [imgList] = await db.query(imgSql); 
        res.json({
            message: "result",
            feed : list[0],
            imgList : imgList
        }); 
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})




module.exports = router