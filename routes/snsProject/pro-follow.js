const express = require('express');
const db = require('../../db');
const router = express.Router();

// ✅ 팔로우 요청
router.post('/', async (req, res) => {
  const { follower, following } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM PRO_FOLLOW WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ?",
      [follower, following]
    );

    if (rows.length > 0) {
      await db.query(
        "UPDATE PRO_FOLLOW SET CANCEL_YN = 'N', FOLLOW_DATE = NOW() WHERE FOLLOW_ID = ?",
        [rows[0].FOLLOW_ID]
      );
    } else {
      await db.query(
        "INSERT INTO PRO_FOLLOW (FOLLOWING_EMAIL, FOLLOWED_EMAIL, FOLLOW_DATE, CANCEL_YN) " +
        "VALUES (?, ?, NOW(), 'N')",
        [follower, following]
      );
    }

    // ✅ 닉네임 가져오기
    const [userInfo] = await db.query(
      "SELECT NICK_NAME FROM PRO_USERS WHERE USER_EMAIL = ?",
      [follower]
    );
    const senderNick = userInfo[0]?.NICK_NAME || '알 수 없음';

    // ✅ 중복 알림 방지
    const [exists] = await db.query(
      "SELECT 1 FROM PRO_NOTIFICATIONS " +
      "WHERE NOTI_TYPE = 'FOLLOW' AND USER_EMAIL = ? AND SENDER_EMAIL = ? AND TARGET_ID = 0",
      [following, follower]
    );

    // ✅ 알림 생성 (팔로우 알림은 항상 TARGET_ID = 0)
    if (exists.length === 0 && follower !== following) {
      await db.query(
        "INSERT INTO PRO_NOTIFICATIONS (USER_EMAIL, SENDER_EMAIL, NOTI_TYPE, MESSAGE, TARGET_ID, IS_READ_YN, CDATE_TIME) " +
        "VALUES (?, ?, 'FOLLOW', ?, 0, 'N', NOW())",
        [following, follower, `${senderNick}님이 당신과 동행을 원합니다.`]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("팔로우 요청 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 팔로우 취소
router.delete('/', async (req, res) => {
  const { follower, following } = req.body;
  try {
    await db.query(
      "UPDATE PRO_FOLLOW SET CANCEL_YN = 'Y' " +
      "WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ?",
      [follower, following]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("팔로우 취소 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 팔로우 상태 확인
router.get('/status', async (req, res) => {
  const { follower, following } = req.query;
  try {
    const [rows] = await db.query(
      "SELECT * FROM PRO_FOLLOW " +
      "WHERE FOLLOWING_EMAIL = ? AND FOLLOWED_EMAIL = ? AND CANCEL_YN = 'N'",
      [follower, following]
    );
    res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    console.error("팔로우 상태 확인 오류:", err);
    res.status(500).json({ isFollowing: false, message: "서버 오류" });
  }
});

module.exports = router;