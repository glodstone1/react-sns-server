// 토큰 검증
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'show-me-the-money'; // .env 없이 하드코딩

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN , 뒤에 띄어져 있어서 공백을 만듬

    if (!token) {
        return res.status(401).json({ message: '인증 토큰 없음', isLogin: false });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 이후 라우터에서 req.user로 사용자 정보 사용 가능
        next(); // 인증이 끝났을 경우 product.js에서 async (req, res)를 실행시킴
    } catch (err) {
        return res.status(403).json({ message: '유효하지 않은 토큰', isLogin: false });
    }
};

// module.exports = jwtAuthentication; // 내보내주기 // 익명함수로 사용 가능