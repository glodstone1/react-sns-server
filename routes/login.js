const express = require('express')
const db = require('../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const jwt = require('jsonwebtoken'); // jwt 토큰
const router = express.Router();


//토큰용 로그인
const JWT_KEY = "show-me-the-money"; // 키 임의로 만들기
router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { userId, pwd } = req.body;
    console.log(userId, pwd);

    // await bcrypt.compare(내가 입력한, db에 저장한 해시)
    // 리턴은 트루, 펄스
    try {
        let query = "SELECT userId, pwd, userName,status, phone FROM TBL_USER WHERE USERID= ?"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [user] = await db.query(query, [userId])
        let result = {};
        if (user.length > 0) {
            let isMatch = await bcrypt.compare(pwd, user[0].pwd); // 기재한 내 비번과 해시화 된 비번을 비교
            if (isMatch) {
                //jwt 토큰 생성
                let payload = {
                    userId: user[0].userId,
                    userName: user[0].userName,
                    userPhone: user[0].phone,
                    userStatus: user[0].status
                };
                const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });
                console.log(token);

                console.log(req.session);
                result = {
                    message: "로그인 성공",
                    success : true,
                    //토큰 리턴
                    token : token
                    // token : token //키하고 밸류가 같으면 그냥 하나로 써도 무방
                };
            } else {
                result = {
                    
                    message: "비밀번호 확인하세요",
                    success : false
                    
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



router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("세션 삭제 안됨");
            res.status(500).send("로그아웃 실패!");
        } else {
            res.clearCookie("connect.sid");
            res.json({ message: "로그아웃 처리" })
        }
    });
})


module.exports = router;
