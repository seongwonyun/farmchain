// // src/routes/reportRoutes.js
// const express = require("express");
// const {
//   downloadOrderMatrixExcel,
// } = require("../controllers/orderReportController");

// const router = express.Router();

// // GET /api/reports/orders-matrix?date=2025-11-20
// router.get("/orders-matrix", downloadOrderMatrixExcel);

// module.exports = router;

// src/routes/reportRoutes.js
const express = require("express");
const ExcelJS = require("exceljs");
const { getOrderMatrixData } = require("../services/orderReportService");
// JWT 인증 미들웨어가 있다면 여기에 추가해서 사용하시면 됩니다.
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/orders-matrix",
  /*authMiddleware,*/ async (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    try {
      // 1) 집계 데이터 가져오기
      const { distributors, products, quantityMap } = await getOrderMatrixData(
        date
      );

      // 2) 엑셀 워크북/시트 생성
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("주문 현황");

      // 열 너비 대략 설정 (A는 라벨/유통사, 나머지는 상품)
      worksheet.getColumn(1).width = 18;

      // 상품 옵션 수만큼 열 추가
      // A열 이후부터 상품 옵션들이 들어감
      let currentCol = 2; // B열부터 시작
      const optionIdByColIndex = {}; // colIndex -> option_id 매핑

      // ────────────────────────────────
      // 3) 1행: 상단 타이틀  "주문 현황 (YYYY-MM-DD)"
      // ────────────────────────────────
      // 전체 상품 옵션 수 계산
      let totalOptionCount = 0;
      for (const product of products) {
        totalOptionCount += product.productOptions.length;
      }
      const lastCol = 1 + totalOptionCount; // A + 옵션수

      // 1행 A1 ~ lastCol까지 병합
      worksheet.mergeCells(1, 1, 1, lastCol);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = `주문 현황 (${date})`;
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.font = { size: 16, bold: true };

      // ────────────────────────────────
      // 4) 2행: 상품명 헤더 (옵션 수만큼 가로 병합)
      //    3행: 옵션명 + 스펙 헤더
      // ────────────────────────────────
      for (const product of products) {
        const colStart = currentCol;
        const options = product.productOptions;

        for (const opt of options) {
          const colIndex = currentCol;

          // 3행: 옵션명 + 스펙
          const optionLabel = [opt.name, opt.spec].filter(Boolean).join(" ");
          const cell = worksheet.getCell(3, colIndex);
          cell.value = optionLabel;
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.font = { size: 11 };

          // 열 너비 적당히
          worksheet.getColumn(colIndex).width = 12;

          // 나중에 유통사별 수량 채우기 위해 매핑 저장
          optionIdByColIndex[colIndex] = opt.id;

          currentCol++;
        }

        const colEnd = currentCol - 1;

        // 2행: 상품명 병합 (옵션이 여러 개면 병합, 하나면 그대로)
        worksheet.mergeCells(2, colStart, 2, colEnd);
        const productCell = worksheet.getCell(2, colStart);
        productCell.value = product.name;
        productCell.alignment = { horizontal: "center", vertical: "middle" };
        productCell.font = { bold: true, size: 12 };
      }

      // A열(2~3행)은 비워두거나 필요하면 라벨 넣어도 됨
      worksheet.getCell("A2").value = "";
      worksheet.getCell("A3").value = "";

      // ────────────────────────────────
      // 5) 4~6행: 전일재고 / 주문량(입고량) / 당일수량
      // ────────────────────────────────
      worksheet.getCell("A4").value = "전일재고";
      worksheet.getCell("A5").value = "주문량(입고량)";
      worksheet.getCell("A6").value = "당일수량";

      ["A4", "A5", "A6"].forEach((addr) => {
        const cell = worksheet.getCell(addr);
        cell.font = { bold: true, size: 12 };
        cell.alignment = { vertical: "middle" };
      });

      // 실제 수량은 아직 정책이 없으니, 일단 빈 값으로 두겠습니다.
      // 필요하면 여기에서 전일재고/당일수량 로직을 추가로 채우면 됩니다.
      // ⭐ 5-1) 주문량(입고량)(5행)에 옵션별 유통사 합계 채우기
      for (let col = 2; col <= lastCol; col++) {
        const optionId = optionIdByColIndex[col];
        if (!optionId) continue;

        let totalQty = 0;
        for (const dist of distributors) {
          const key = `${Number(dist.id)}-${Number(optionId)}`;
          const qty = quantityMap.get(key) || 0;
          totalQty += qty;
        }

        const cell = worksheet.getCell(5, col);
        cell.value = totalQty === 0 ? "" : totalQty;
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      // ────────────────────────────────
      // 6) 7행 이후: 유통사별 주문 수량
      //     A열: 유통사명
      //     B~: (유통사, 옵션ID)에 매칭되는 수량
      // ────────────────────────────────
      let rowIndex = 7;

      for (const dist of distributors) {
        const row = worksheet.getRow(rowIndex);

        // A열: 유통사 이름
        row.getCell(1).value = dist.name;
        row.getCell(1).font = { bold: true, size: 11 };

        // 각 옵션 컬럼에 대해 수량 채우기
        for (let col = 2; col <= lastCol; col++) {
          const optionId = optionIdByColIndex[col];
          if (!optionId) continue;

          const key = `${Number(dist.id)}-${Number(optionId)}`;
          const qty = quantityMap.get(key) || 0;

          // 0이면 빈 칸으로 둘지, 0을 찍을지 선택
          row.getCell(col).value = qty === 0 ? "" : qty;
          row.getCell(col).alignment = {
            horizontal: "center",
            vertical: "middle",
          };
        }

        rowIndex++;
      }

      // ────────────────────────────────
      // 7) 테두리 & 정렬 약간 손보기 (원하는 만큼 꾸며 사용)
      // ────────────────────────────────
      const totalRows = rowIndex - 1;
      for (let r = 2; r <= totalRows; r++) {
        for (let c = 1; c <= lastCol; c++) {
          const cell = worksheet.getCell(r, c);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      }

      // ────────────────────────────────
      // 8) 응답 헤더 설정 & 전송
      // ────────────────────────────────
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="order-matrix-${date}.xlsx"`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error("orders-matrix excel error:", err);
      res
        .status(500)
        .json({ message: "주문 현황 엑셀 생성 중 오류가 발생했습니다." });
    }
  }
);

module.exports = router;
