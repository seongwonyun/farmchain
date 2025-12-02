"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fc_token", res.token);
        window.localStorage.setItem("fc_user", JSON.stringify(res.user));
      }
      router.push("/orders");
    } catch (err: any) {
      setError("로그인에 실패했습니다. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fc-container" style={{ paddingTop: "3rem" }}>
      <div className="fc-card">
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          팜체인 로그인
        </h1>
        <form
          onSubmit={handleSubmit}
          className="fc-form"
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label
              style={{
                fontSize: "0.8rem",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              이메일
            </label>
            <input
              className="fc-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label
              style={{
                fontSize: "0.8rem",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              className="fc-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          {error && (
            <div style={{ color: "#b91c1c", fontSize: "0.8rem" }}>{error}</div>
          )}
          <button className="fc-btn" type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
