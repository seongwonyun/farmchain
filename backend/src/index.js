// 🔹 1) 최상단에서 .env 로드
const dotenv = require("dotenv");
dotenv.config();

// 🔹 2) 그 다음부터 나머지 require
const express = require("express");
const cors = require("cors");
const { authRouter } = require("./routes/auth");
const { productsRouter } = require("./routes/products");
const { ordersRouter } = require("./routes/orders");
const { dispatchRouter } = require("./routes/dispatch");
const { notificationsRouter } = require("./routes/notifications");
const { authenticate } = require("./middlewares/authMiddleware");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FarmChain Supabase API" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", authenticate, productsRouter);
app.use("/api/orders", authenticate, ordersRouter);
app.use("/api/dispatch", authenticate, dispatchRouter);
app.use("/api/notifications", authenticate, notificationsRouter);
app.use("/api/reports", authenticate, reportRoutes);

const port = process.env.PORT || 3001;

// 🔹 3) 디버깅용 로그 (잠깐만 써보세요)
console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);

app.listen(port, () => {
  console.log(`✅ FarmChain backend (Supabase) running on port ${port}`);
});
