// 📁 routes/pro-like.js
const express = require('express');
const db = require('../../db');
const router = express.Router();

// ✅ 추천 상태 및 총 추천 수 조회
router.get('/status', async (req, res) => {
  const { email, type, id } = req.query;

  try {
    // 총 추천 수
    const [countResult] = await db.query(`
      SELECT COUNT(*) AS count
      FROM PRO_LIKE
      WHERE CONTENT_TYPE = ? AND TARGET_ID = ? AND CANCEL_YN = 'N'
    `, [type, id]);

    // 현재 사용자가 추천했는지
    const [likeResult] = await db.query(`
      SELECT * FROM PRO_LIKE
      WHERE USER_EMAIL = ? AND CONTENT_TYPE = ? AND TARGET_ID = ? AND CANCEL_YN = 'N'
    `, [email, type, id]);

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
  const { email, content_type, target_id } = req.body;
  const now = new Date();

  try {
    // 현재 상태 확인
    const [existing] = await db.query(`
      SELECT * FROM PRO_LIKE
      WHERE USER_EMAIL = ? AND CONTENT_TYPE = ? AND TARGET_ID = ?
    `, [email, content_type, target_id]);

    if (existing.length === 0) {
      // 추천 정보가 없으면 새로 추가
      await db.query(`
        INSERT INTO PRO_LIKE (USER_EMAIL, CONTENT_TYPE, TARGET_ID, UDATE_TIME, CANCEL_YN)
        VALUES (?, ?, ?, ?, 'N')
      `, [email, content_type, target_id, now]);

      res.json({ result: 'liked' });
    } else {
      // 있으면 상태 토글
      const current = existing[0];
      const newState = current.CANCEL_YN === 'N' ? 'Y' : 'N';

      await db.query(`
        UPDATE PRO_LIKE
        SET CANCEL_YN = ?, UDATE_TIME = ?
        WHERE LIKE_ID = ?
      `, [newState, now, current.LIKE_ID]);

      res.json({ result: newState === 'N' ? 'liked' : 'unliked' });
    }
  } catch (err) {
    console.error('추천 토글 오류:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;