// src/controllers/orderReportController.js
const ExcelJS = require("exceljs");
const { getOrderMatrixData } = require("../services/orderReportService");

async function downloadOrderMatrixExcel(req, res) {
  try {
    // ?date=2025-11-20 형태
    const date =
      (req.query.date && String(req.query.date)) ||
      new Date().toISOString().slice(0, 10);

    const { distributors, products, quantityMap } = await getOrderMatrixData(
      date
    );

    // 엑셀 워크북/시트 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("주문 현황");

    // ---- 1) 컬럼 정의 ----
    // A~D: 상품 정보 / 이후 열은 유통사
    const baseHeader = [
      { header: "상품명", key: "productName", width: 20 },
      { header: "옵션", key: "optionName", width: 16 },
      { header: "규격", key: "spec", width: 12 },
      { header: "단위", key: "unit", width: 8 },
    ];

    const distributorColumns = distributors.map((d) => ({
      header: d.name,
      key: `dist_${d.id.toString()}`,
      width: 10,
    }));

    worksheet.columns = [...baseHeader, ...distributorColumns];

    const totalColumnCount = baseHeader.length + distributorColumns.length;

    // ---- 2) 제목 행 ----
    worksheet.mergeCells(1, 1, 1, totalColumnCount);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = `주문 현황 (${date})`;
    titleCell.alignment = { horizontal: "center" };
    titleCell.font = { bold: true, size: 14 };

    // ---- 3) 상단 요약 3줄 (전일재고 / 주문량 / 당일수량) ----
    const prevStockRow = worksheet.addRow(["전일재고", "", "", ""]);
    const orderAmountRow = worksheet.addRow(["주문량(입고량)", "", "", ""]);
    const todayQtyRow = worksheet.addRow(["당일수량", "", "", ""]);

    [prevStockRow, orderAmountRow, todayQtyRow].forEach((row) => {
      row.font = { bold: true };
    });

    // ---- 4) 본문: 상품+옵션 행 생성 & 유통사별 합계 계산 ----
    const distributorTotals = {};

    for (const product of products) {
      if (!product.productOptions || product.productOptions.length === 0)
        continue;

      for (const option of product.productOptions) {
        const rowValues = [
          product.name,
          option.name,
          option.spec,
          product.unit,
        ];

        for (const dist of distributors) {
          const distId = Number(dist.id);
          const key = `${distId}-${Number(option.id)}`;
          const qty = quantityMap.get(key) ?? 0;

          rowValues.push(qty === 0 ? "" : qty);

          distributorTotals[distId] = (distributorTotals[distId] || 0) + qty;
        }

        worksheet.addRow(rowValues);
      }
    }

    // ---- 5) 상단 요약 행에 열 합계 채우기 ----
    distributors.forEach((dist, index) => {
      const distId = Number(dist.id);
      const colIndex = baseHeader.length + index + 1; // 1-based index
      const total = distributorTotals[distId] || 0;

      // "주문량(입고량)" 행에 합계 입력
      orderAmountRow.getCell(colIndex).value = total;

      // 전일재고/당일수량은 재고 테이블 생기면 여기서 채워넣으면 됩니다.
      // prevStockRow.getCell(colIndex).value = prevStockTotal;
      // todayQtyRow.getCell(colIndex).value = todayQtyTotal;
    });

    // ---- 6) 스타일 (테두리, 정렬) ----
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 2) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });
      }
    });

    // ---- 7) 응답 헤더 설정 & 엑셀 파일 전송 ----
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
  } catch (error) {
    console.error("downloadOrderMatrixExcel error:", error);
    res.status(500).json({
      message: "엑셀 파일 생성 중 오류가 발생했습니다.",
      error: error && error.message ? error.message : String(error),
    });
  }
}

module.exports = {
  downloadOrderMatrixExcel,
};
