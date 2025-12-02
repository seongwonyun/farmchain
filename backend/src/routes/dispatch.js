const express = require("express");

const dispatchRouter = express.Router();

const mockDispatches = [
  {
    id: 1,
    orderId: 1,
    vehicle: "부산 12가 3456",
    driverName: "김기사",
    status: "ON_ROUTE",
    eta: "오늘 14:00 도착 예정"
  }
];

dispatchRouter.get("/", (req, res) => {
  res.json({ dispatches: mockDispatches });
});

module.exports = { dispatchRouter };