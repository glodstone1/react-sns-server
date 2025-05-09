const express = require('express')
const db = require('./db') // 2

const feedRouter = require('./routes/feed') // A. routes 내의 product.js 쓰기다른 종류의 파일을 참조할 경우 확장자명 기재 할것
const snsFeed = require('./routes/sns/feed')
const proUserRouter = require('./routes/snsProject/pro-user')
const proFeedRouter = require('./routes/snsProject/pro-feed')
const path = require('path');

// 추가 1. 서버 종료 후 npm i cors 로 패키지 설치
const cors = require('cors') // 추가 2.cors
var session = require('express-session') // 세션api 사용

const app = express()
app.use(express.json()); // 3
app.use('/uploads',express.static(path.join(__dirname, 'uploads')));  
app.use(cors({
    origin : ["http://localhost:3000","http://localhost:3001"],
    credentials : true // 이 도메인에 한에서 쿠키를 주고 받을 수 있게 하는 'credentials'
}))
// app.use(cors())// 추가 3. cors
app.use(session({
    secret: 'test1234', // 하드코딩
    resave: false,
    saveUninitialized: false, // 세션 들어갈때마다 갱신여부
    cookie: { 
        httpOnly : true, // 이게 제일 중요 (서버가 넘겨주는 쿠키를 막아줌 보안용)
        secure: false,
        maxAge: 1000*60*30 // 세션 유지시간
    }
  }))

app.use("/feed", feedRouter);//B. 참조용으로 선언
app.use("/sns-feed", snsFeed);
app.use("/pro-user", proUserRouter);
app.use("/pro-feed", proFeedRouter);




app.listen(3005, () => {
    console.log("서버 실행 중...");
})