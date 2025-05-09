const express = require('express')
const db = require('../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const router = express.Router();


router.get("/logout",(req,res)=>{
    req.session.destroy(err=>{
        if(err){
            console.log("세션 삭제 안됨");
            res.status(500).send("로그아웃 실패!");
        }else{
            res.clearCookie("connect.sid");
            res.json({message:"로그아웃 처리"})
        }
    });
})

//user  로그인 백업
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
            if(isMatch){
                req.session.user={ // 세션 아이디 활용시 쿼리문 콜론명이랑 동일 시킬것
                    sessionId : user[0].userId,
                    sessionName : user[0].userName,
                    sessionPhone : user[0].phone,
                    sessionStatus : user[0].status
                }
                console.log(req.session);
                result = {
                    message: "로그인 성공",
                    user : req.session.user
                }; /// 확인필요
            }else{
                result = {
                    message: "비밀번호 확인하세요",
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


router.post("/join", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let {userId, pwd, name, addr, phone } = req.body;

    try {
        let hashPwd = await bcrypt.hash(pwd,10); //숫자 10 -> 해시화를 10번 반복하겠다
        let query = "INSERT INTO TBL_USER VALUES(?,?,?,?,?,NOW(),NOW(),'C')"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [user] = await db.query(query, [userId, hashPwd, name, addr, phone])
       
        
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})

//세션 정보 확인하는 주소
router.get("/info",(req,res)=>{
    console.log(req.session.user);
    if(req.session.user){
        res.json({
            isLogin : true,
            user : req.session.user
        })
    } else {
        res.json({
            isLogin : false
        })
    }
})



module.exports = router;
