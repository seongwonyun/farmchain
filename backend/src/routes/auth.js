const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호를 입력해주세요." });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, email, name, role, distributor_id, password AS stored_password FROM users WHERE email = $1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const user = rows[0];

    // 데모 용도로 비밀번호를 평문 비교 (실서비스에서는 반드시 bcrypt로 해시를 사용하세요)
    if (user.stored_password !== password) {
      return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      distributorId: user.distributor_id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "dev_secret", {
      expiresIn: "12h"
    });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "로그인 중 오류가 발생했습니다." });
  }
});

module.exports = { authRouter };