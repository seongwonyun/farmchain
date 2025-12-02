const express = require("express");
const { pool } = require("../db");

const ordersRouter = express.Router();

async function getOrCreateCart(userId, distributorId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM orders WHERE user_id = $1 AND status = 'DRAFT' ORDER BY id DESC LIMIT 1",
      [userId]
    );

    let order;
    if (rows.length === 0) {
      const insert = await client.query(
        `INSERT INTO orders (distributor_id, user_id, status, total_amount)
         VALUES ($1, $2, 'DRAFT', 0)
         RETURNING *`,
        [distributorId, userId]
      );
      order = insert.rows[0];
    } else {
      order = rows[0];
    }

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function recalcOrderTotal(orderId, db = pool) {
  const { rows } = await db.query(
    `UPDATE orders
     SET total_amount = COALESCE((
       SELECT SUM(line_total) FROM order_items WHERE order_id = $1
     ), 0),
     updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [orderId]
  );
  return rows[0];
}

// ✅ 추가: 장바구니 요약 API
// GET /api/orders/cart/summary
ordersRouter.get("/cart/summary", async (req, res) => {
  const user = req.user;

  try {
    // 1) 현재 사용자 DRAFT 주문(장바구니) 찾기
    const { rows: orders } = await pool.query(
      `SELECT id, total_amount
       FROM orders
       WHERE user_id = $1 AND status = 'DRAFT'
       ORDER BY id DESC
       LIMIT 1`,
      [user.id]
    );

    // DRAFT 주문이 없으면 0, 0으로 응답
    if (orders.length === 0) {
      return res.json({
        itemCount: 0,
        totalAmount: 0,
      });
    }

    const order = orders[0];

    // 2) 해당 주문의 총 수량 합계
    const { rows: countRows } = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) AS item_count
       FROM order_items
       WHERE order_id = $1`,
      [order.id]
    );

    const itemCount = Number(countRows[0].item_count) || 0;

    return res.json({
      itemCount,
      totalAmount: Number(order.total_amount) || 0,
    });
  } catch (err) {
    console.error("Cart summary error:", err);
    return res
      .status(500)
      .json({ message: "장바구니 요약을 가져오는 중 오류가 발생했습니다." });
  }
});

// GET /api/orders/cart
ordersRouter.get("/cart", async (req, res) => {
  console.log("req:", req);
  const user = req.user;
  try {
    const order = await getOrCreateCart(user.id, user.distributorId);
    const { rows: items } = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         p.name AS product_name,
         oi.product_option_id,
         po.name AS product_option_name,
         po.spec,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN product_options po ON po.id = oi.product_option_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return res.json({
      id: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      items,
    });
  } catch (err) {
    console.error("Get cart error:", err);
    return res
      .status(500)
      .json({ message: "장바구니를 가져오는 중 오류가 발생했습니다." });
  }
});

// POST /api/orders/cart/items
ordersRouter.post("/cart/items", async (req, res) => {
  const user = req.user;
  const { productId, productOptionId, quantity } = req.body || {};
  const qty = Number(quantity) || 0;

  if (!productId || !productOptionId || qty <= 0) {
    return res
      .status(400)
      .json({ message: "productId, productOptionId, quantity는 필수입니다." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const order = await getOrCreateCart(user.id, user.distributorId);

    const prodRes = await client.query(
      `SELECT p.id, p.name, po.id AS option_id, po.name AS option_name, po.spec, po.price
       FROM products p
       JOIN product_options po ON po.product_id = p.id
       WHERE p.id = $1 AND po.id = $2`,
      [productId, productOptionId]
    );

    if (prodRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "상품 또는 옵션을 찾을 수 없습니다." });
    }

    const option = prodRes.rows[0];

    const existing = await client.query(
      `SELECT * FROM order_items
       WHERE order_id = $1 AND product_id = $2 AND product_option_id = $3
       LIMIT 1`,
      [order.id, productId, productOptionId]
    );

    const unitPrice = option.price;
    if (existing.rows.length > 0) {
      const item = existing.rows[0];
      const newQty = item.quantity + qty;
      const newLine = newQty * unitPrice;
      await client.query(
        `UPDATE order_items
         SET quantity = $1,
             unit_price = $2,
             line_total = $3
         WHERE id = $4`,
        [newQty, unitPrice, newLine, item.id]
      );
    } else {
      const lineTotal = unitPrice * qty;
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_option_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, productId, productOptionId, qty, unitPrice, lineTotal]
      );
    }

    const updatedOrder = await recalcOrderTotal(order.id, client);

    await client.query("COMMIT");

    const { rows: items } = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         p.name AS product_name,
         oi.product_option_id,
         po.name AS product_option_name,
         po.spec,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN product_options po ON po.id = oi.product_option_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return res.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      totalAmount: updatedOrder.total_amount,
      items,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add cart item error:", err);
    return res
      .status(500)
      .json({ message: "장바구니 담기 중 오류가 발생했습니다." });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/cart/items/:id
ordersRouter.patch("/cart/items/:id", async (req, res) => {
  const user = req.user;
  const itemId = Number(req.params.id);
  const qty = Number(req.body?.quantity);

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ message: "수량은 1 이상 정수여야 합니다." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const order = await getOrCreateCart(user.id, user.distributorId);

    const { rows: items } = await client.query(
      "SELECT * FROM order_items WHERE id = $1 AND order_id = $2",
      [itemId, order.id]
    );

    if (items.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "항목을 찾을 수 없습니다." });
    }

    const item = items[0];
    const lineTotal = qty * item.unit_price;

    await client.query(
      `UPDATE order_items
       SET quantity = $1,
           line_total = $2
       WHERE id = $3`,
      [qty, lineTotal, itemId]
    );

    const updatedOrder = await recalcOrderTotal(order.id, client);

    await client.query("COMMIT");

    const { rows: newItems } = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         p.name AS product_name,
         oi.product_option_id,
         po.name AS product_option_name,
         po.spec,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN product_options po ON po.id = oi.product_option_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return res.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      totalAmount: updatedOrder.total_amount,
      items: newItems,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update cart item error:", err);
    return res
      .status(500)
      .json({ message: "장바구니 수량 변경 중 오류가 발생했습니다." });
  } finally {
    client.release();
  }
});

// DELETE /api/orders/cart/items/:id
ordersRouter.delete("/cart/items/:id", async (req, res) => {
  const user = req.user;
  const itemId = Number(req.params.id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const order = await getOrCreateCart(user.id, user.distributorId);

    await client.query(
      "DELETE FROM order_items WHERE id = $1 AND order_id = $2",
      [itemId, order.id]
    );

    const updatedOrder = await recalcOrderTotal(order.id, client);

    await client.query("COMMIT");

    const { rows: items } = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         p.name AS product_name,
         oi.product_option_id,
         po.name AS product_option_name,
         po.spec,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN product_options po ON po.id = oi.product_option_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return res.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      totalAmount: updatedOrder.total_amount,
      items,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete cart item error:", err);
    return res
      .status(500)
      .json({ message: "장바구니 항목 삭제 중 오류가 발생했습니다." });
  } finally {
    client.release();
  }
});

// POST /api/orders/cart/submit
ordersRouter.post("/cart/submit", async (req, res) => {
  const user = req.user;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await getOrCreateCart(user.id, user.distributorId);

    const { rows: items } = await client.query(
      "SELECT COUNT(*) AS cnt FROM order_items WHERE order_id = $1",
      [order.id]
    );
    const count = Number(items[0].cnt);
    if (count === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "장바구니에 상품이 없습니다." });
    }

    await recalcOrderTotal(order.id, client);

    const { rows: updated } = await client.query(
      `UPDATE orders
       SET status = 'SUBMITTED',
           updated_at = NOW(),
           submitted_at = NOW()
       WHERE id = $1
       RETURNING id, status`,
      [order.id]
    );

    await client.query("COMMIT");

    return res.json({ orderId: updated[0].id, status: updated[0].status });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Submit order error:", err);
    return res
      .status(500)
      .json({ message: "주문 확정 중 오류가 발생했습니다." });
  } finally {
    client.release();
  }
});

// GET /api/orders/history
ordersRouter.get("/history", async (req, res) => {
  const user = req.user;
  try {
    const { rows } = await pool.query(
      `SELECT id, status, total_amount, submitted_at
       FROM orders
       WHERE user_id = $1 AND status = 'SUBMITTED'
       ORDER BY submitted_at DESC NULLS LAST, id DESC`,
      [user.id]
    );

    const orders = rows.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: o.total_amount,
      submittedAt: o.submitted_at,
    }));

    return res.json({ orders });
  } catch (err) {
    console.error("Order history error:", err);
    return res
      .status(500)
      .json({ message: "주문 내역을 가져오는 중 오류가 발생했습니다." });
  }
});

// GET /api/orders/:id
ordersRouter.get("/:id", async (req, res) => {
  const user = req.user;
  const orderId = Number(req.params.id);

  try {
    const { rows: orders } = await pool.query(
      `SELECT *
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: "주문을 찾을 수 없습니다." });
    }

    const order = orders[0];

    const { rows: items } = await pool.query(
      `SELECT
         oi.id,
         oi.product_id,
         p.name AS product_name,
         oi.product_option_id,
         po.name AS product_option_name,
         po.spec,
         oi.quantity,
         oi.unit_price,
         oi.line_total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN product_options po ON po.id = oi.product_option_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [order.id]
    );

    return res.json({
      id: order.id,
      status: order.status,
      totalAmount: order.total_amount,
      submittedAt: order.submitted_at,
      items,
    });
  } catch (err) {
    console.error("Order detail error:", err);
    return res
      .status(500)
      .json({ message: "주문 상세를 가져오는 중 오류가 발생했습니다." });
  }
});

module.exports = { ordersRouter };
