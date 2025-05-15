// 📁 routes/pro-like.js
const express = require('express');
const db = require('../../db');
const router = express.Router();

// ✅ 추천 상태 및 총 추천 수 조회
router.get('/status', async (req, res) => {
  const { email, type, id } = req.query;

  try {
    const [countResult] = await db.query(
      "SELECT COUNT(*) AS count " +
      "FROM PRO_LIKE " +
      "WHERE CONTENT_TYPE = ? AND TARGET_ID = ? AND CANCEL_YN = 'N'",
      [type, id]
    );

    const [likeResult] = await db.query(
      "SELECT * FROM PRO_LIKE " +
      "WHERE USER_EMAIL = ? AND CONTENT_TYPE = ? AND TARGET_ID = ? AND CANCEL_YN = 'N'",
      [email, type, id]
    );

    res.json({
      liked: likeResult.length > 0,
      count: countResult[0].count
    });
  } catch (err) {
    console.error('추천 상태 조회 오류:', err);
    res.status(500).send('Server Error');
  }
});

// ✅ 추천 토글 (추천 or 취소)
router.post('/toggle', async (req, res) => {
  const { email, content_type, target_id, owner_email } = req.body;
  const now = new Date();

  try {
    const [existing] = await db.query(
      "SELECT * FROM PRO_LIKE " +
      "WHERE USER_EMAIL = ? AND CONTENT_TYPE = ? AND TARGET_ID = ?",
      [email, content_type, target_id]
    );

    let action = '';
    if (existing.length === 0) {
      await db.query(
        "INSERT INTO PRO_LIKE (USER_EMAIL, CONTENT_TYPE, TARGET_ID, UDATE_TIME, CANCEL_YN) " +
        "VALUES (?, ?, ?, ?, 'N')",
        [email, content_type, target_id, now]
      );
      action = 'liked';
    } else {
      const current = existing[0];
      const newState = current.CANCEL_YN === 'N' ? 'Y' : 'N';

      await db.query(
        "UPDATE PRO_LIKE SET CANCEL_YN = ?, UDATE_TIME = ? WHERE LIKE_ID = ?",
        [newState, now, current.LIKE_ID]
      );
      action = newState === 'N' ? 'liked' : 'unliked';
    }

    // ✅ 알림 생성 (좋아요 눌렀을 때만, 취소는 제외)
    if (action === 'liked' && email !== owner_email) {
      const [userInfo] = await db.query(
        "SELECT NICK_NAME FROM PRO_USERS WHERE USER_EMAIL = ?",
        [email]
      );
      const senderNick = userInfo[0]?.NICK_NAME || '알 수 없음';

      const [exists] = await db.query(
        "SELECT 1 FROM PRO_NOTIFICATIONS " +
        "WHERE NOTI_TYPE = 'LIKE' AND USER_EMAIL = ? AND TARGET_ID = ?",
        [owner_email, target_id]
      );

      if (exists.length === 0) {
        await db.query(
          "INSERT INTO PRO_NOTIFICATIONS (USER_EMAIL, SENDER_EMAIL, NOTI_TYPE, MESSAGE, TARGET_ID, IS_READ_YN, CDATE_TIME) " +
          "VALUES (?, ?, 'LIKE', ?, ?, 'N', NOW())",
          [owner_email, email, `${senderNick}님이 게시글을 추천했습니다.`, target_id]
        );
      }
    }

    res.json({ result: action });
  } catch (err) {
    console.error('추천 토글 오류:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;