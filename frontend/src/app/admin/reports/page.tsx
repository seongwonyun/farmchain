// // 예: src/app/admin/reports/page.tsx (Next.js App Router)
// "use client";

// import { useState } from "react";

// export default function OrderReportPage() {
//   const [date, setDate] = useState<string>(
//     new Date().toISOString().slice(0, 10)
//   );

//   // 🔹 2) 토큰 불러오기
//   const token =
//     typeof window !== "undefined"
//       ? window.localStorage.getItem("fc_token")
//       : null;

//   console.log("fc_token:", token);

//   if (!token) {
//     alert("로그인이 필요합니다. 다시 로그인해주세요.");
//     return;
//   }

//   const downloadUrl = `http://localhost:3001/api/reports/orders-matrix?date=${date}`;

//   return (
//     <div className="p-4">
//       <h1 className="text-xl font-bold mb-4">주문 현황 엑셀 다운로드</h1>

//       <div className="flex items-center gap-2 mb-4">
//         <label>날짜:</label>
//         <input
//           type="date"
//           value={date}
//           onChange={(e) => setDate(e.target.value)}
//           className="border px-2 py-1 rounded"
//         />
//       </div>

//       <a
//         href={downloadUrl}
//         className="inline-flex items-center px-4 py-2 border rounded bg-black text-white"
//       >
//         엑셀 다운로드
//       </a>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function OrderReportPage() {
  const router = useRouter();

  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false); // 토큰 확인 완료 여부

  // 🔹 1) 클라이언트에서만 localStorage 접근
  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedToken = window.localStorage.getItem("fc_token");
    console.log("fc_token from localStorage:", storedToken);

    if (!storedToken) {
      // 브라우저 환경에서만 alert 사용
      window.alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
      router.replace("/login"); // 로그인 페이지 경로에 맞게 수정
    } else {
      setToken(storedToken);
    }

    setTokenChecked(true);
  }, [router]);

  // 🔹 2) 토큰 확인 완료 전에는 로딩 표시
  if (!tokenChecked) {
    return (
      <div className="p-4">
        <p>로그인 정보를 확인하는 중입니다...</p>
      </div>
    );
  }

  // 🔹 3) 토큰이 없는 상태일 때 (useEffect에서 리다이렉트 중)
  if (!token) {
    return (
      <div className="p-4">
        <p>로그인이 필요합니다. 로그인 페이지로 이동 중입니다...</p>
      </div>
    );
  }

  // 🔹 4) 엑셀 다운로드 핸들러 (Authorization 헤더 포함)
  const handleDownload = async () => {
    try {
      console.log(API_BASE_URL);
      setLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/reports/orders-matrix?date=${date}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("download error:", text);
        window.alert("엑셀 다운로드 중 오류가 발생했습니다.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `order-matrix-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      window.alert("엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 5) 실제 화면 렌더
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">주문 현황 엑셀 다운로드</h1>

      <div className="flex items-center gap-2 mb-4">
        <label>날짜:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
      </div>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border rounded bg-black text-white disabled:opacity-50"
      >
        {loading ? "다운로드 중..." : "엑셀 다운로드"}
      </button>
    </div>
  );
}
