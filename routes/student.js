const express = require('express')
const db = require('../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const router = express.Router();
const authMiddleware = require('./auth'); // 중간에서 토큰 검증하는 함수
const multer  = require('multer');
const path = require('path');



router.get("/", async (req, res) => {  // 7.async로 동기화 

    try {
        let [list] = await db.query("SELECT * FROM STUDENT");
        console.log(list);
        res.json({
            message: "result",
            list: list,
        }); 
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/:stu_no", async (req, res) => { // :productId 동적으로 처리하기
    let { stu_no } = req.params;
    try {
        let [list] = await db.query("SELECT * FROM STUDENT WHERE stu_no=" + stu_no);
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
    let {stu_no, stu_name, stu_dept, stu_grade, stu_class, stu_gender, stu_height, stu_weight } = req.body;
    try {
        let query = "INSERT INTO STUDENT VALUES(?,?,?,?,?,?,?,?)"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [resultList] = await db.query(query, [stu_no, stu_name, stu_dept, stu_grade, stu_class, stu_gender, stu_height, stu_weight])
        res.json({
            message: "result",
            resultList: resultList
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})


router.delete("/:stu_no", async (req, res) => {
    let { stu_no } = req.params;
    console.log(stu_no);
    try {
        let result = await db.query("DELETE FROM STUDENT WHERE stu_no=" + stu_no);
        res.json({
            message: "삭제되었습니다.",

        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.put("/:stu_no", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let {stu_no, stu_name, stu_dept, stu_grade, stu_class, stu_gender, stu_height, stu_weight } = req.body;
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


module.exports = router;