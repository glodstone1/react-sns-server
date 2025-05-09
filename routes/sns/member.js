const express = require('express')
const db = require('../../db') // db 폴더가 멀어졌기 때문에 .을 하나 더 붙여준다
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const jwt = require('jsonwebtoken'); // jwt 토큰
const router = express.Router();
const multer  = require('multer'); // 파일 업로드



//토큰용 로그인
const JWT_KEY = "show-me-the-money"; // 키 임의로 만들기
router.post("/", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let { email, pwd } = req.body;
    console.log(email, pwd);
    // await bcrypt.compare(내가 입력한, db에 저장한 해시)
    // 리턴은 트루, 펄스
    try {
        let query = "SELECT email, pwd, userName, addr, phone, birth, intro,profileImg FROM TBL_MEMBER WHERE EMAIL= ?"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [member] = await db.query(query, [email])
        console.log(member);
        let result = {};
        if (member.length > 0) {
            let isMatch = await bcrypt.compare(pwd, member[0].pwd); // 기재한 내 비번과 해시화 된 비번을 비교
            if (isMatch) {
                //jwt 토큰 생성
                let payload = {
                    email: member[0].email,
                    userName: member[0].userName,
                    Phone: member[0].phone
                };
                const token = jwt.sign(payload, JWT_KEY, { expiresIn: '1h' });
                console.log(token);

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

router.get("/:email", async (req, res) => { // :productId 동적으로 처리하기
    let { email } = req.params;
    console.log(email);
    try {
        let [list] = await db.query("SELECT * FROM TBL_MEMBER WHERE EMAIL= '" + email + "'");
        console.log(list);
        res.json({
            message: "result",
            info: list[0]
        }); // 5
    } catch (err) {
        console.log("에러 발생!",err.message);
        res.status(500).send("Server Error");
    }
})


const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
    let {email} = req.body;
    const filename = req.file.filename; 
    const destination = req.file.destination; 
    try{
        let query = "UPDATE TBL_MEMBER SET PROFILEIMG = ? WHERE EMAIL = ?";
        let result = await db.query(query, [destination+filename, email]);
        
        res.json({
            message : "result",
            result : result
        });
    } catch(err){
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
});


router.post("/join", async (req, res) => {  // 같은 주소지지만 post, get이냐에 따라 다르게 호출
    let {email, pwd, userName, addr, phone, birth, intro} = req.body;

    try {
        let hashPwd = await bcrypt.hash(pwd,10); //숫자 10 -> 해시화를 10번 반복하겠다
        let query = "INSERT INTO TBL_MEMBER VALUES(?,?,?,?,?,?,?,null,NOW(),NOW())"; // 4 ,6 list에 [] 붙이고 await 써주기
        let [member] = await db.query(query, [email, hashPwd, userName, addr, phone, birth, intro])
       res.json({})
        
    } catch (err) {
        console.log("에러 발생!");
        res.status(500).send("Server Error");
    }
})





module.exports = router;