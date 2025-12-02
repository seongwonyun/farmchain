// "use client";

// import Link from "next/link";
// import { usePathname } from "next/navigation";

// const items = [
//   { href: "/orders", label: "발주" },
//   { href: "/cart", label: "장바구니" },
//   { href: "/orders/history", label: "발주내역" },
//   // { href: "/dispatch", label: "배차" },
//   { href: "/mypage", label: "마이" },
//   // { href: "/admin/reports", label: "엑셀다운" },
// ];

// export function BottomNav() {
//   const pathname = usePathname();
//   if (pathname === "/login") return null;

//   return (
//     <nav className="fc-bottom-nav">
//       {items.map((item) => {
//         const active =
//           pathname === item.href || pathname.startsWith(item.href + "/");
//         return (
//           <Link
//             key={item.href}
//             href={item.href}
//             className={active ? "fc-active" : ""}
//           >
//             <span>{item.label}</span>
//           </Link>
//         );
//       })}
//     </nav>
//   );
// }

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  distributorId?: number | null;
}

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // 🔹 항상 훅부터 먼저 호출해야 함 (조건문보다 위에!)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("fc_user");
    console.log("fc_user:", stored);

    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("fc_user parse error:", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]); // ⭐ pathname 을 의존성에 추가 → 화면 이동할 때마다 다시 읽기

  // 🔹 그 다음에 조건부 return
  if (pathname === "/login") return null;

  // 기본 메뉴
  const items = [
    { href: "/orders", label: "발주" },
    { href: "/cart", label: "장바구니" },
    { href: "/orders/history", label: "발주내역" },
    { href: "/mypage", label: "마이" },
  ];

  // ADMIN 권한이면 엑셀다운 추가
  if (
    user &&
    typeof user.role === "string" &&
    user.role.toUpperCase() === "ADMIN"
  ) {
    items.push({ href: "/admin/reports", label: "엑셀다운" });
  }

  return (
    <nav className="fc-bottom-nav">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "fc-active" : ""}
          >
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
