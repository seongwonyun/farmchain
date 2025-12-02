// // src/services/orderReportService.js
// const { PrismaClient } = require("../generated/prisma");

// // PrismaClient 인스턴스 생성
// const prisma = new PrismaClient();

// /**
//  * 날짜 기준 주문 매트릭스 데이터 조회
//  * @param {string} date - 예: "2025-11-20"
//  */
// async function getOrderMatrixData(date) {
//   // 1) 전체 유통사
//   const distributors = await prisma.distributor.findMany({
//     orderBy: { id: "asc" },
//   });

//   // 2) 전체 상품 + 옵션 (활성 옵션만)
//   const products = await prisma.product.findMany({
//     where: { isActive: true },
//     include: {
//       productOptions: {
//         where: { isActive: true },
//         orderBy: { sortOrder: "asc" },
//       },
//     },
//     orderBy: [{ category: "asc" }, { name: "asc" }],
//   });

//   // 3) 특정 날짜 주문 집계
//   //   - 날짜 기준: orders.submitted_at 의 '날짜' 부분
//   //   - 상태: SUBMITTED, CONFIRMED, COMPLETED 만 집계
//   const aggRows = await prisma.$queryRaw`
//     SELECT
//       o.distributor_id,
//       oi.product_id,
//       oi.product_option_id,
//       COALESCE(SUM(oi.quantity), 0) AS total_quantity
//     FROM order_items oi
//     JOIN orders o ON oi.order_id = o.id
//     WHERE
//       o.submitted_at::date = ${date}::date
//       AND o.status IN ('SUBMITTED', 'CONFIRMED', 'COMPLETED')
//     GROUP BY
//       o.distributor_id,
//       oi.product_id,
//       oi.product_option_id
//   `;

//   // 4) (유통사ID, 옵션ID) → 수량 매핑
//   const quantityMap = new Map();

//   for (const row of aggRows) {
//     const distId = Number(row.distributor_id);
//     const optId = Number(row.product_option_id);
//     const key = `${distId}-${optId}`;
//     const qty = Number(row.total_quantity) || 0;
//     quantityMap.set(key, qty);
//   }

//   return {
//     distributors,
//     products,
//     quantityMap,
//   };
// }

// module.exports = {
//   getOrderMatrixData,
// };

// src/services/orderReportService.js
const { pool } = require("../db");

// 집계 결과 생성
async function getOrderMatrixData(date) {
  const client = await pool.connect();

  try {
    // 1) 전체 유통사
    const distResult = await client.query(
      `
      SELECT id, code, name
      FROM distributors
      ORDER BY id ASC
      `
    );
    const distributors = distResult.rows;

    // 2) 전체 상품 + 옵션 (활성 옵션만)
    const prodResult = await client.query(
      `
      SELECT
        p.id   AS product_id,
        p.name AS product_name,
        p.category,
        p.unit,
        po.id        AS option_id,
        po.name      AS option_name,
        po.spec,
        po.price,
        po.sort_order
      FROM products p
      JOIN product_options po ON po.product_id = p.id
      WHERE p.is_active = true
        AND po.is_active = true
      ORDER BY p.category, p.name, po.sort_order, po.id
      `
    );

    // products 형태로 변환
    const productMap = new Map();

    for (const row of prodResult.rows) {
      if (!productMap.has(row.product_id)) {
        productMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          category: row.category,
          unit: row.unit,
          productOptions: [],
        });
      }

      productMap.get(row.product_id).productOptions.push({
        id: row.option_id,
        name: row.option_name,
        spec: row.spec,
        price: row.price,
        sortOrder: row.sort_order,
      });
    }

    const products = Array.from(productMap.values());

    // 3) 특정 날짜 주문 집계
    //   - 날짜 기준: orders.submitted_at::date
    //   - 상태: SUBMITTED, CONFIRMED, COMPLETED
    const aggResult = await client.query(
      `
      SELECT
        o.distributor_id,
        oi.product_id,
        oi.product_option_id,
        COALESCE(SUM(oi.quantity), 0) AS total_quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE
        o.submitted_at::date = $1::date
        AND o.status IN ('SUBMITTED', 'CONFIRMED', 'COMPLETED')
      GROUP BY
        o.distributor_id,
        oi.product_id,
        oi.product_option_id
      `,
      [date]
    );

    // 4) (유통사ID, 옵션ID) → 수량 매핑
    const quantityMap = new Map();

    for (const row of aggResult.rows) {
      const distId = Number(row.distributor_id);
      const optId = Number(row.product_option_id);
      const key = `${distId}-${optId}`;

      let qty = row.total_quantity;
      // pg가 numeric 등을 string으로 줄 때 대비
      if (typeof qty === "string") {
        qty = parseFloat(qty);
      }
      if (qty == null || Number.isNaN(qty)) {
        qty = 0;
      }

      quantityMap.set(key, qty);
    }

    return {
      distributors,
      products,
      quantityMap,
    };
  } finally {
    client.release();
  }
}

module.exports = {
  getOrderMatrixData,
};
