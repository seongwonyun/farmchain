"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Dispatch {
  id: number;
  orderId: number;
  vehicle: string;
  driverName: string;
  status: string;
  eta: string;
}

export default function DispatchPage() {
  const [list, setList] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch("/dispatch");
        setList(res.dispatches || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="fc-container">
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>배차 현황</h1>
      {loading && <div>불러오는 중...</div>}
      {list.length === 0 && !loading && <div>배차 정보가 없습니다.</div>}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}
      >
        {list.map((d) => (
          <div key={d.id} className="fc-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>주문 #{d.orderId}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  차량 {d.vehicle}
                </div>
              </div>
              <div style={{ textAlign: "right", fontSize: "0.85rem" }}>
                <div>{d.status}</div>
                <div style={{ color: "#6b7280" }}>{d.eta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}