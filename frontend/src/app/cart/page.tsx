"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CartItem {
  id: number;
  product_name: string;
  product_option_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Cart {
  id: number;
  status: string;
  items: CartItem[];
  totalAmount: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const loadCart = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/orders/cart");
      setCart(res);
    } catch (err: any) {
      setMessage("장바구니를 불러오지 못했습니다. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (item: CartItem, delta: number) => {
    const nextQty = item.quantity + delta;
    if (nextQty <= 0) return;
    await apiFetch(`/orders/cart/items/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: nextQty }),
    });
    await loadCart();
  };

  const removeItem = async (item: CartItem) => {
    await apiFetch(`/orders/cart/items/${item.id}`, {
      method: "DELETE",
    });
    await loadCart();
  };

  const submitOrder = async () => {
    try {
      const res = await apiFetch("/orders/cart/submit", {
        method: "POST",
      });
      setMessage("주문이 제출되었습니다.");
      router.push(`/orders/${res.orderId}`);
    } catch (err: any) {
      setMessage("주문 제출 실패: " + err.message);
    }
  };

  return (
    <div className="fc-container" style={{ paddingBottom: "1.5rem" }}>
      <h1 style={{ fontSize: "1.3rem", margin: "1rem 0" }}>장바구니</h1>
      {loading && <div>불러오는 중...</div>}
      {message && (
        <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          {message}
        </div>
      )}
      {cart && (cart.items?.length || 0) === 0 && (
        <div>장바구니에 담긴 상품이 없습니다.</div>
      )}
      {cart && cart.items && cart.items.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {cart.items.map((item) => (
              <div key={item.id} className="fc-card">
                <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.product_option_name} · {item.spec}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      className="fc-chip"
                      type="button"
                      onClick={() => updateQty(item, -1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="fc-chip"
                      type="button"
                      onClick={() => updateQty(item, 1)}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {/* <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      단가 {item.unit_price.toLocaleString()}원
                    </div> */}
                    <div style={{ fontWeight: 600 }}>
                      {item.line_total.toLocaleString()}원
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
                  <button
                    type="button"
                    className="fc-chip"
                    onClick={() => removeItem(item)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="fc-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span>총 주문금액</span>
              <strong>{cart.totalAmount.toLocaleString()}원</strong>
            </div>
            <button className="fc-btn" type="button" onClick={submitOrder}>
              주문 확정하기
            </button>
          </div>
        </>
      )}
    </div>
  );
}
