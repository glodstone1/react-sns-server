const express = require('express')
const db = require('../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const router = express.Router();
const authMiddleware = require('./auth'); // 중간에서 토큰 검증하는 함수
const multer  = require('multer'); // 파일 업로드
const path = require('path');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, Date.now() + '_' + base + ext);
  }
});

const upload = multer({ storage: storage });

// router.get("/", async (req, res) => {  // 7.async로 동기화 
//     console.log(req);
//     let { pageSize, offset } = req.query;
//     try {
//         let sql = "SELECT * FROM tbl_product LIMIT ? OFFSET ?";
//         let [list] = await db.query(sql, [parseInt(pageSize), parseInt(offset)]); // 4 ,6 list에 [] 붙이고 await 써주기
//         let [count] = await db.query("SELECT COUNT(*) AS cnt FROM tbl_product")
//         console.log(list);
//         res.json({
//             message: "result",
//             list: list,
//             count: count[0]
//         }); // 5
//     } catch (err) {
//         console.log("에러 발생!");
//         res.status(500).send("Server Error");
//     }
// })

//useEffect용
router.get("/", async (req, res) => {  // 7.async로 동기화 
    try {
        let sql = "SELECT * FROM tbl_product";
        let [list] = await db.query(sql); // 4 ,6 list에 [] 붙이고 await 써주기
        let [count] = await db.query("SELECT COUNT(*) AS cnt FROM tbl_product")
        console.log(list);
        res.json({
            message: "result",
            list: list,
            count: count[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/:productId", async (req, res) => { // :productId 동적으로 처리하기
    let { productId } = req.params;
    console.log(productId);
    try {
        let [list] = await db.query("SELECT * FROM TBL_PRODUCT WHERE PRODUCTID=" + productId);
        console.log(list);
        res.json({
            message: "result",
            info: list[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { productName, description, price, stock, category } = req.body;
    console.log(productName, description, price, stock, category);
    try {
        let query = "INSERT INTO TBL_PRODUCT VALUES(NULL,?,?,?,?,?,'Y',NOW(),NOW())"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [list] = await db.query(query, [productName, description, price, stock, category])
        res.json({
            message: "result",
            list: list
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})
                    //authMiddleware 중간에 토큰 검증을 하고 일치 할 경우, async (req, res)를 실행
router.delete("/:productId",authMiddleware, async (req, res) => { // :productId 동적으로 처리하기
    let { productId } = req.params;
    console.log(productId);
    try {
        let result = await db.query("DELETE FROM TBL_PRODUCT WHERE PRODUCTID=" + productId);
        res.json({
            message: "삭제되었습니다.",

        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.put("/:productId", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { productId } = req.params;
    let { productName, description, price, stock, category } = req.body;
    console.log(productName, description, price, stock, category);
    try {

        let query = "UPDATE TBL_PRODUCT SET PRODUCTNAME = ?, DESCRIPTION = ?, PRICE = ?, STOCK = ?, CATEGORY = ? WHERE PRODUCTID=?"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [list] = await db.query(query, [productName, description, price, stock, category, productId])
        res.json({
            message: "수정됨",
            list: list
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.post('/upload', upload.array('photos', 12), async (req, res) => {
    const files = req.files;
    const { productId } = req.body;

    if (!files || files.length === 0 || !productId) {
        return res.status(400).json({ message: "파일 또는 productId 없음" });
    }

    try {
        for (let file of files) {
            const fileName = file.originalname;
            const filePath = file.path; // multer가 자동으로 저장한 경로 (예: uploads/xxxxxx)

            await db.query(`
                INSERT INTO TBL_PRODUCT_FILE (productId, fileName, filePath)
                VALUES (?, ?, ?)
            `, [productId, fileName, filePath]);
        }

        res.json({ message: "업로드 성공" });
    } catch (err) {
        console.error("업로드 중 에러:", err);
        res.status(500).json({ message: "서버 에러" });
    }
});

module.exports = router;