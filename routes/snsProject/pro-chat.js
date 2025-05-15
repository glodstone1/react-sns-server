const express = require('express');
const router = express.Router();
const db = require('../../db');

// ✅ 메시지 전송 API
router.post('/', async (req, res) => {
  const { sender, receiver, content } = req.body;

  if (!sender || !receiver || !content) {
    return res.status(400).json({ result: 'fail', message: '필수값 누락' });
  }

  try {
    const query =
      "INSERT INTO PRO_MESSAGE (SENDER_EMAIL, RECEIVER_EMAIL, CONTENT, IS_READ_YN, CDATE_TIME) " +
      "VALUES (?, ?, ?, 'N', NOW())";
    await db.query(query, [sender, receiver, content]);

    res.json({ result: 'success', message: '메시지 전송 완료' });
  } catch (err) {
    console.error('메시지 전송 오류:', err);
    res.status(500).json({ result: 'fail', message: '서버 오류' });
  }
});

// ✅ DM 목록 조회 API
// GET /pro-chat/list/:myEmail
router.get('/list/:email', async (req, res) => {
  const myEmail = req.params.email;
  console.log(myEmail);

  try {
    const query =
      "SELECT " +
      "  CASE " +
      "    WHEN SENDER_EMAIL = ? THEN RECEIVER_EMAIL " +
      "    ELSE SENDER_EMAIL " +
      "  END AS other_user, " +
      "  MAX(CDATE_TIME) AS last_time, " +
      "  MAX(CONTENT) AS last_msg, " +
      "  SUM(CASE WHEN IS_READ_YN = 'N' AND RECEIVER_EMAIL = ? THEN 1 ELSE 0 END) AS unread_count " +
      "FROM PRO_MESSAGE " +
      "WHERE SENDER_EMAIL = ? OR RECEIVER_EMAIL = ? " +
      "GROUP BY other_user " +
      "ORDER BY last_time DESC";
    const [rows] = await db.query(query, [myEmail, myEmail, myEmail, myEmail]);

    res.json({ result: 'success', data: rows });
  } catch (err) {
    console.error('DM 목록 조회 오류:', err);
    res.status(500).json({ result: 'fail', message: '서버 오류' });
  }
});

// ✅ 두 사용자 간의 채팅 내역 조회 API
// GET /pro-chat/chat?me=abc@a.com&you=def@b.com
router.get('/chat', async (req, res) => {
  const { me, you } = req.query;

  if (!me || !you) {
    return res.status(400).json({ result: 'fail', message: '필수 파라미터(me, you) 누락' });
  }

  try {
    const query =
      "SELECT * FROM PRO_MESSAGE " +
      "WHERE " +
      "  (SENDER_EMAIL = ? AND RECEIVER_EMAIL = ?) " +
      "  OR " +
      "  (SENDER_EMAIL = ? AND RECEIVER_EMAIL = ?) " +
      "ORDER BY CDATE_TIME ASC";
    const [rows] = await db.query(query, [me, you, you, me]);

    res.json({ result: 'success', data: rows });
  } catch (err) {
    console.error('채팅 내역 조회 오류:', err);
    res.status(500).json({ result: 'fail', message: '서버 오류' });
  }
});

// ✅ 메시지 읽음 처리 API
// PATCH /pro-chat/read
router.patch('/read', async (req, res) => {
  const { me, you } = req.body;

  if (!me || !you) {
    return res.status(400).json({ result: 'fail', message: '필수 파라미터(me, you) 누락' });
  }

  try {
    const query =
      "UPDATE PRO_MESSAGE " +
      "SET IS_READ_YN = 'Y' " +
      "WHERE SENDER_EMAIL = ? AND RECEIVER_EMAIL = ? AND IS_READ_YN = 'N'";

    const [result] = await db.query(query, [you, me]); // 상대방이 보낸 메시지

    res.json({ result: 'success', affectedRows: result.affectedRows });
  } catch (err) {
    console.error('읽음 처리 오류:', err);
    res.status(500).json({ result: 'fail', message: '서버 오류' });
  }
});


// ✅ 유저 검색 API (닉네임 또는 이메일 포함)
router.get('/search', async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.status(400).json({ result: 'fail', message: '검색어가 필요합니다' });
  }

  try {
    const query =
      "SELECT USER_EMAIL, NICK_NAME, PROFILE_IMG " +
      "FROM PRO_USERS " +
      "WHERE DELETE_YN = 'N' AND (USER_EMAIL LIKE ? OR NICK_NAME LIKE ?)";
    const like = `%${keyword}%`;
    const [rows] = await db.query(query, [like, like]);

    res.json({ result: 'success', data: rows });
  } catch (err) {
    console.error("검색 오류:", err);
    res.status(500).json({ result: 'fail', message: '서버 오류' });
  }
});

module.exports = router;