"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  submittedAt?: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/orders/history");
      setOrders(res.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="fc-container">
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>발주 내역</h1>
      {loading && <div>불러오는 중...</div>}
      {orders.length === 0 && !loading && <div>발주 내역이 없습니다.</div>}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1rem"
        }}
      >
        {orders.map((o) => (
          <Link key={o.id} href={`/orders/${o.id}`} className="fc-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>주문번호 #{o.id}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  상태: {o.status}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  총금액
                </div>
                <strong>{o.totalAmount.toLocaleString()}원</strong>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}