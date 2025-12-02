const express = require("express");

const notificationsRouter = express.Router();

const mockNotifications = [
  {
    id: 1,
    type: "ORDER",
    title: "주문 접수 완료",
    message: "오늘 새벽 단호박 주문이 정상 접수되었습니다.",
    createdAt: new Date().toISOString(),
    read: false
  },
  {
    id: 2,
    type: "DISPATCH",
    title: "배차 완료",
    message: "브로콜리 차량이 배차되었습니다.",
    createdAt: new Date().toISOString(),
    read: false
  }
];

notificationsRouter.get("/", (req, res) => {
  res.json({ notifications: mockNotifications });
});

module.exports = { notificationsRouter };