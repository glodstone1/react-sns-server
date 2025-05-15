const express = require('express');
const db = require('./db');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

const feedRouter = require('./routes/feed');
const snsFeed = require('./routes/sns/feed');
const proUserRouter = require('./routes/snsProject/pro-user');
const proFeedRouter = require('./routes/snsProject/pro-feed');
const proLikeRouter = require('./routes/snsProject/pro-like');
const proFollowRouter = require('./routes/snsProject/pro-follow');
const proNotificationRouter = require('./routes/snsProject/pro-notification');
const proChatRouter = require('./routes/snsProject/pro-chat');

const app = express();

// ✅ 1. socket.io 통합 준비
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// ✅ 2. socket.io 연결 설정
io.on('connection', (socket) => {
  console.log('✅ Socket 연결됨:', socket.id);

  // 유저가 본인 이메일로 join
  socket.on('register', (email) => {
    socket.join(email); // 이메일 = 소켓 방 이름
    console.log(`📡 ${email} 유저가 방에 접속`);
  });

  // 메시지 전송 받으면 → 특정 대상에게 emit
  socket.on('send_dm', ({ to, message }) => {
    io.to(to).emit('receive_dm', message); // to = 이메일
    console.log(`📨 ${to}에게 메시지 전송됨:`, message);
  });

  socket.on('disconnect', () => {
    console.log('❌ 연결 종료:', socket.id);
  });
});

// ✅ 3. 미들웨어
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(session({
  secret: 'test1234',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 30
  }
}));

// ✅ 4. 라우팅
app.use('/feed', feedRouter);
app.use('/sns-feed', snsFeed);
app.use('/pro-user', proUserRouter);
app.use('/pro-feed', proFeedRouter);
app.use('/pro-like', proLikeRouter);
app.use('/pro-follow', proFollowRouter);
app.use('/pro-notification', proNotificationRouter);
app.use('/pro-chat', proChatRouter);

// ✅ 5. 서버 실행 (http + socket.io)
server.listen(3005, () => {
  console.log('✅ 서버 실행 중 (socket 포함) http://localhost:3005');
});