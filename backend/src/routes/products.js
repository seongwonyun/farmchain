const express = require("express");
const { pool } = require("../db");

const productsRouter = express.Router();

// GET /api/products?search=&category=
productsRouter.get("/", async (req, res) => {
  const { search = "", category } = req.query;
  const q = String(search || "").trim().toLowerCase();

  try {
    const params = [];
    let whereClauses = ["p.is_active = true", "po.is_active = true"];

    if (category && category !== "ALL") {
      params.push(category);
      whereClauses.push(`p.category = $${params.length}`);
    }

    if (q) {
      params.push(`%${q}%`);
      params.push(`%${q}%`);
      whereClauses.push(`(LOWER(p.name) LIKE $${params.length-1} OR LOWER(po.name) LIKE $${params.length})`);
    }

    const whereSql = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

    const sql = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.category,
        p.unit,
        po.id AS option_id,
        po.name AS option_name,
        po.spec,
        po.price
      FROM products p
      JOIN product_options po ON po.product_id = p.id
      ${whereSql}
      ORDER BY p.name, po.sort_order, po.id
    `;

    const { rows } = await pool.query(sql, params);

    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          category: row.category,
          unit: row.unit,
          options: []
        });
      }
      map.get(row.product_id).options.push({
        id: row.option_id,
        name: row.option_name,
        spec: row.spec,
        price: row.price
      });
    }

    const products = Array.from(map.values());
    return res.json({ products });
  } catch (err) {
    console.error("Get products error:", err);
    return res.status(500).json({ message: "상품 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

module.exports = { productsRouter };