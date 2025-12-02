"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  distributorId?: number | null;
}

export default function MyPage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("fc_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fc_token");
      window.localStorage.removeItem("fc_user");
    }
    router.push("/login");
  };

  return (
    <div className="fc-container">
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>마이페이지</h1>
      <div className="fc-card">
        {user ? (
          <>
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>이름</div>
              <div>{user.name}</div>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                이메일
              </div>
              <div>{user.email}</div>
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>권한</div>
              <div>{user.role}</div>
            </div>
            <button className="fc-btn" type="button" onClick={logout}>
              로그아웃
            </button>
          </>
        ) : (
          <div>로그인 정보가 없습니다.</div>
        )}
      </div>
    </div>
  );
}