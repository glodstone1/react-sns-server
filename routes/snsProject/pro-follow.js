// 📁 routes/pro-like.js
const express = require('express');
const db = require('../../db');
const router = express.Router();

//팔로우
router.post('/', async (req, res) => {
  const { follower, following } = req.body;
  try {
    // 기존 팔로우 기록 확인
    const [rows] = await db.query(
      "SELECT * FROM PRO_FOLLOW WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ?",
      [follower, following]
    );

    if (rows.length > 0) {
      // 기존 관계 있음 → 소프트 삭제 복구
      await db.query(
        "UPDATE PRO_FOLLOW SET CANCEL_YN = 'N', FOLLOW_DATE = NOW() WHERE FOLLOW_ID = ?",
        [rows[0].FOLLOW_ID]
      );
    } else {
      // 신규 팔로우
      await db.query(
        `INSERT INTO PRO_FOLLOW (FOLLOWING_EMAIL, FOLLOWED_EMAIL, FOLLOW_DATE, CANCEL_YN)
         VALUES (?, ?, NOW(), 'N')`,
        [follower, following]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("팔로우 요청 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

router.delete('/', async (req, res) => { // 보통 update쿼리는 put을 쓰지만 delete가 더 직관적이라 이렇게 씀
  const { follower, following } = req.body;
  try {
    await db.query(
      `UPDATE PRO_FOLLOW 
       SET CANCEL_YN = 'Y' 
       WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ?`,
      [follower, following]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("팔로우 취소 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// 팔로우 상태 확인
router.get('/status', async (req, res) => {
  const { follower, following } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT * FROM PRO_FOLLOW 
       WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ? AND CANCEL_YN = 'N'`,
      [follower, following]
    );

    res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    console.error("팔로우 상태 확인 오류:", err);
    res.status(500).json({ isFollowing: false, message: "서버 오류" });
  }
});


module.exports = router;