const express = require('express')
const db = require('../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const router = express.Router();
const multer  = require('multer');




router.get("/", async (req, res) => {  // 7.async로 동기화 

    try {
        let [list] = await db.query("SELECT * FROM TBL_BOARD B INNER JOIN tbl_user U ON B.userId = U.userId");

        
        console.log(list);
        res.json({
            message: "result",
            list: list

        }); 
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/:boardNo", async (req, res) => { // :productId 동적으로 처리하기
    let { boardNo } = req.params;
    try {
        let [list] = await db.query("SELECT * FROM TBL_BOARD B INNER JOIN tbl_user U ON B.userId = U.userId WHERE boardNo=" + boardNo);
        let Cnt = await db.query("UPDATE TBL_BOARD SET CNT = CNT+1 WHERE boardNo=" + boardNo);
        res.json({
            message: "result",
            info: list[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.get("/", async (req, res) => {
    try {
        let [list] = await db.query("SELECT * FROM TBL_BOARD WHERE CNT >= '20'");
        res.json({
            message: "result",
            list: list
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    
    let {title, contents} = req.body;
    try {
        let query = "INSERT INTO TBL_BOARD VALUES(NULL,?,?,'user001','0',NOW(),NOW())"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [resultList] = await db.query(query, [title, contents])
        res.json({
            message: "result",
            resultList: resultList
        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})


router.delete("/:boardNo", async (req, res) => {
    let { boardNo } = req.params;
    // console.log(stu_no);
    try {
        let result = await db.query("DELETE FROM TBL_BOARD WHERE boardNo=" + boardNo);
        res.json({
            message: "삭제되었습니다.",

        }); // 5
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

router.put("/:boardNo", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    // boardNo, title, contents, userId, cnt, cdatetime, udatetime
    let { boardNo } = req.params;
    let {title, contents} = req.body;
    try {

        let query = "UPDATE TBL_BOARD SET TITLE = ?, CONTENTS = ?, UDATETIME = NOW() WHERE BOARDNO=?"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [list] = await db.query(query, [title, contents, boardNo])
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