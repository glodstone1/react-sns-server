
const express = require('express');
const db = require('../../db');
const router = express.Router();



// ✅ 알림 생성 API 예시 (댓글 작성 시 호출되도록 만들면 됨)
router.post('/comment-alert', async (req, res) => {
  const { commenterEmail, postOwner, postId } = req.body;
  console.log("댓글 정보", commenterEmail, postOwner, postId);
  if (commenterEmail !== postOwner) {
    await db.query(
      "INSERT INTO PRO_NOTIFICATIONS (USER_EMAIL, SENDER_EMAIL, NOTI_TYPE, MESSAGE, TARGET_ID, IS_READ_YN, CDATE_TIME) " +
      "VALUES (?, ?, 'COMMENT', ?, ?, 'N', NOW())",
      [postOwner, commenterEmail, `${senderNick}님이 댓글을 남겼습니다.`, postId]
    );
  }

  res.json({ message: "알림 생성 완료" });
});


router.get('/notification/recent', async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).send("User required");

  const [rows] = await db.query(
    "SELECT N.NOTI_ID, N.NOTI_TYPE, N.MESSAGE, N.TARGET_ID, N.CDATE_TIME, " +
    "U.NICK_NAME " +
    "FROM PRO_NOTIFICATIONS N " +
    "JOIN PRO_USERS U ON U.USER_EMAIL = N.USER_EMAIL " +
    "WHERE N.USER_EMAIL = ? " +
    "AND N.IS_READ_YN = 'N' " +
    "ORDER BY N.CDATE_TIME DESC",
    [user]
  );

  res.json(rows);
});


router.patch('/notification/:notiId/read', async (req, res) => {
  const { notiId } = req.params;

  try {
    await db.query(
      "UPDATE PRO_NOTIFICATIONS SET IS_READ_YN = 'Y' WHERE NOTI_ID = ?",
      [notiId]
    );
    res.json({ message: "읽음 처리 완료" });
  } catch (err) {
    console.error("알림 읽음 처리 에러:", err);
    res.status(500).send("Server Error");
  }
});


// ✅ 안 읽은 알림 수 조회 API
router.get('/notification/unread/count', async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).send("User required");

  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM PRO_NOTIFICATIONS WHERE USER_EMAIL = ? AND IS_READ_YN = 'N'",
      [user]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error("안 읽은 알림 카운트 에러:", err);
    res.status(500).send("Server Error");
  }
});

// 전체 알림 조회
// 📌 전체 알림 목록 - 읽지 않은 항목만, sender 정보 포함
router.get('/all', async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).send("User required");

  try {
    const [rows] = await db.query(
      "SELECT N.NOTI_ID, N.NOTI_TYPE, N.MESSAGE, N.TARGET_ID, N.CDATE_TIME, " +
      "       S.NICK_NAME, S.PROFILE_IMG, S.USER_EMAIL AS SENDER_EMAIL " +
      "FROM PRO_NOTIFICATIONS N " +
      "JOIN PRO_USERS S ON S.USER_EMAIL = N.SENDER_EMAIL " +
      "WHERE N.USER_EMAIL = ? AND N.IS_READ_YN = 'N' " +
      "ORDER BY N.CDATE_TIME DESC",
      [user]
    );

    res.json(rows);
  } catch (err) {
    console.error("알림 전체 조회 오류:", err);
    res.status(500).send("Server Error");
  }
});

router.patch('/notification/:id/read', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "UPDATE PRO_NOTIFICATIONS SET IS_READ_YN = 'Y' WHERE NOTI_ID = ?",
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("알림 읽음 처리 오류:", err);
    res.status(500).send("Server Error");
  }
});



module.exports = router;