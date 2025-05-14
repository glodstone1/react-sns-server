
const express = require('express');
const db = require('../../db');
const router = express.Router();



// ✅ 알림 생성 API 예시 (댓글 작성 시 호출되도록 만들면 됨)
router.post('/comment-alert', async (req, res) => {
  const { commenterEmail, postOwner, postId } = req.body;
  console.log("댓글 정보",commenterEmail, postOwner, postId);
  if (commenterEmail !== postOwner) {
    await db.query(
      "INSERT INTO PRO_NOTIFICATIONS (USER_EMAIL, NOTI_TYPE, MESSAGE, TARGET_ID, IS_READ_YN, CDATE_TIME) " +
      "VALUES (?, ?, ?, ?, 'N', NOW())",
      [receiverEmail, 'COMMENT', `${senderNick}님이 댓글을 남겼습니다.`, postId]
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
    "JOIN PRO_USERS U ON U.USER_EMAIL = N.USER_EMAIL " + // 수신자 기준 조인
    "WHERE N.USER_EMAIL = ? AND N.IS_READ_YN = 'N' AND N.NOTI_TYPE = 'COMMENT' " +
    "ORDER BY N.CDATE_TIME DESC " +
    "LIMIT 1",
    [user]
  );

  res.json(rows);
});



module.exports = router;