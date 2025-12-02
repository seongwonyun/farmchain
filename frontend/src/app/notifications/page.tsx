"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/notifications");
        setList(res.notifications || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fc-container">
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>알림</h1>
      {loading && <div>불러오는 중...</div>}
      {list.length === 0 && !loading && <div>알림이 없습니다.</div>}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}
      >
        {list.map((n) => (
          <div key={n.id} className="fc-card">
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              {new Date(n.createdAt).toLocaleString("ko-KR")}
            </div>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
            <div style={{ fontSize: "0.9rem" }}>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}