"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface Item {
  id: number;
  product_name: string;
  product_option_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  submittedAt?: string;
  items: Item[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/orders/${id}`);
        setOrder(res);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  return (
    <div className="fc-container">
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>주문 상세</h1>
      {loading && <div>불러오는 중...</div>}
      {!loading && !order && <div>주문을 찾을 수 없습니다.</div>}
      {order && (
        <div className="fc-card">
          <div style={{ marginBottom: "0.5rem" }}>
            <div>주문번호 #{order.id}</div>
            <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              상태: {order.status}{" "}
              {order.submittedAt && `· ${order.submittedAt}`}
            </div>
          </div>
          <div
            style={{ borderTop: "1px solid #e5e7eb", margin: "0.5rem 0" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "0.5rem"
            }}
          >
            {order.items.map((item) => (
              <div key={item.id} style={{ fontSize: "0.9rem" }}>
                <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  {item.product_option_name} · {item.spec}
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>수량 {item.quantity}개</span>
                  <span>{item.line_total.toLocaleString()}원</span>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{ borderTop: "1px solid #e5e7eb", margin: "0.5rem 0" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>총 금액</span>
            <strong>{order.totalAmount.toLocaleString()}원</strong>
          </div>
        </div>
      )}
    </div>
  );
}