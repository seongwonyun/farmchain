// "use client";

// import { useEffect, useState } from "react";
// import { apiFetch } from "@/lib/api";

// interface ProductOption {
//   id: number;
//   name: string;
//   spec: string;
//   price: number;
// }

// interface Product {
//   id: number;
//   name: string;
//   category: string;
//   unit: string;
//   options: ProductOption[];
// }

// export default function OrdersPage() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [search, setSearch] = useState("");
//   const [category, setCategory] = useState("ALL");
//   const [selectedOption, setSelectedOption] = useState<
//     Record<number, number | null>
//   >({});
//   const [quantities, setQuantities] = useState<Record<number, number>>({});
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [message, setMessage] = useState<string | null>(null);

//   const loadProducts = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await apiFetch(
//         `/products?search=${encodeURIComponent(search)}&category=${category}`
//       );
//       setProducts(res.products || []);
//     } catch (err: any) {
//       setError("상품을 불러오지 못했습니다. " + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadProducts();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [category]);

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     loadProducts();
//   };

//   const handleSelectOption = (productId: number, optionId: number) => {
//     setSelectedOption((prev) => ({ ...prev, [productId]: optionId }));
//     setMessage(null);
//   };

//   const handleQtyChange = (productId: number, delta: number) => {
//     setQuantities((prev) => {
//       const current = prev[productId] || 1;
//       const next = Math.max(1, current + delta);
//       return { ...prev, [productId]: next };
//     });
//   };

//   const handleAddToCart = async (product: Product) => {
//     const optionId = selectedOption[product.id];
//     if (!optionId) {
//       setMessage(`"${product.name}" 옵션을 선택해주세요.`);
//       return;
//     }
//     const qty = quantities[product.id] || 1;
//     try {
//       await apiFetch("/orders/cart/items", {
//         method: "POST",
//         body: JSON.stringify({
//           productId: product.id,
//           productOptionId: optionId,
//           quantity: qty,
//         }),
//       });
//       setMessage("장바구니에 담았습니다.");
//     } catch (err: any) {
//       setMessage("장바구니 담기 실패: " + err.message);
//     }
//   };

//   return (
//     <div className="fc-container" style={{ paddingBottom: "1.5rem" }}>
//       <header style={{ margin: "1rem 0" }}>
//         <h1 style={{ fontSize: "1.3rem", marginBottom: "1.25rem" }}>
//           오늘 발주할 상품을 선택하세요
//         </h1>
//       </header>

//       <form
//         onSubmit={handleSearch}
//         style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
//       >
//         <input
//           className="fc-input"
//           placeholder="상품명 검색 (예: 단호박, 브로콜리)"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         <button className="fc-btn" type="submit">
//           검색
//         </button>
//       </form>

//       <div
//         style={{
//           marginBottom: "0.75rem",
//           display: "flex",
//           gap: "0.5rem",
//           flexWrap: "wrap",
//         }}
//       >
//         {["ALL", "채소", "과일"].map((cat) => (
//           <button
//             key={cat}
//             type="button"
//             className={`fc-chip ${category === cat ? "fc-chip-active" : ""}`}
//             onClick={() => setCategory(cat)}
//           >
//             {cat === "ALL" ? "전체" : cat}
//           </button>
//         ))}
//       </div>

//       {loading && <div>상품을 불러오는 중입니다...</div>}
//       {error && (
//         <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
//       )}
//       {message && (
//         <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
//           {message}
//         </div>
//       )}

//       <div
//         style={{
//           display: "flex",
//           flexDirection: "column",
//           gap: "0.75rem",
//           paddingBottom: "1rem",
//         }}
//       >
//         {products.map((p) => {
//           const activeOptionId = selectedOption[p.id] ?? null;
//           const qty = quantities[p.id] || 1;
//           return (
//             <div key={p.id} className="fc-card">
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   marginBottom: "0.5rem",
//                 }}
//               >
//                 <div>
//                   <div style={{ fontWeight: 600 }}>{p.name}</div>
//                   <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
//                     {p.category} · {p.unit} 단위
//                   </div>
//                 </div>
//               </div>
//               <div
//                 style={{
//                   marginBottom: "0.5rem",
//                   display: "flex",
//                   flexWrap: "wrap",
//                   gap: "0.4rem",
//                 }}
//               >
//                 {p.options.map((opt) => {
//                   const active = activeOptionId === opt.id;
//                   return (
//                     <button
//                       key={opt.id}
//                       type="button"
//                       className={`fc-chip ${active ? "fc-chip-active" : ""}`}
//                       onClick={() => handleSelectOption(p.id, opt.id)}
//                     >
//                       <span>{opt.name}</span>
//                       <span style={{ marginLeft: "0.25rem", color: "#6b7280" }}>
//                         ({opt.spec})
//                       </span>
//                       <span style={{ marginLeft: "0.25rem", fontWeight: 600 }}>
//                         {opt.price.toLocaleString()}원
//                       </span>
//                     </button>
//                   );
//                 })}
//               </div>
//               <div
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: "0.5rem",
//                   }}
//                 >
//                   <button
//                     type="button"
//                     className="fc-chip"
//                     onClick={() => handleQtyChange(p.id, -1)}
//                   >
//                     -
//                   </button>
//                   <span>{qty}</span>
//                   <button
//                     type="button"
//                     className="fc-chip"
//                     onClick={() => handleQtyChange(p.id, 1)}
//                   >
//                     +
//                   </button>
//                 </div>
//                 <button
//                   type="button"
//                   className="fc-btn"
//                   onClick={() => handleAddToCart(p)}
//                 >
//                   장바구니 담기
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

interface CartSummary {
  itemCount: number;
  totalAmount: number;
}

interface ProductOption {
  id: number;
  name: string;
  spec: string;
  price: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  options: ProductOption[];
}

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedOption, setSelectedOption] = useState<
    Record<number, number | null>
  >({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const router = useRouter();

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/products?search=${encodeURIComponent(search)}&category=${category}`
      );
      setProducts(res.products || []);
    } catch (err: any) {
      setError("상품을 불러오지 못했습니다. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCartSummary = async () => {
    try {
      const res = await apiFetch("/orders/cart/summary");
      setCartSummary({
        itemCount: res.itemCount ?? 0,
        totalAmount: res.totalAmount ?? 0,
      });
    } catch {
      setCartSummary(null);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCartSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
    loadCartSummary();
  };

  const handleSelectOption = (productId: number, optionId: number) => {
    setSelectedOption((prev) => ({ ...prev, [productId]: optionId }));
    setMessage(null);
  };

  const handleQtyChange = (productId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = async (product: Product) => {
    const optionId = selectedOption[product.id];
    if (!optionId) {
      setMessage(`"${product.name}" 옵션을 선택해주세요.`);
      return;
    }
    const qty = quantities[product.id] || 1;
    try {
      await apiFetch("/orders/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          productOptionId: optionId,
          quantity: qty,
        }),
      });

      await loadCartSummary();
      // setToast(`"${product.name}"(을)를 장바구니에 담았습니다.`);
      setMessage(null);
    } catch (err: any) {
      setMessage("장바구니 담기 실패: " + err.message);
    }
  };

  return (
    <div
      className="fc-container"
      style={{
        // 탭바 + 플로팅 요약바 공간
        paddingBottom: "6rem",
      }}
    >
      <header style={{ margin: "1rem 0" }}>
        <h1 style={{ fontSize: "1.3rem", marginBottom: "1.25rem" }}>
          오늘 발주할 상품을 선택하세요
        </h1>
      </header>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
      >
        <input
          className="fc-input"
          placeholder="상품명 검색 (예: 단호박, 브로콜리)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="fc-btn" type="submit">
          검색
        </button>
      </form>

      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {["ALL", "채소", "과일"].map((cat) => (
          <button
            key={cat}
            type="button"
            className={`fc-chip ${category === cat ? "fc-chip-active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "ALL" ? "전체" : cat}
          </button>
        ))}
      </div>

      {loading && <div>상품을 불러오는 중입니다...</div>}
      {error && (
        <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</div>
      )}
      {message && (
        <div style={{ marginBottom: "0.5rem", fontSize: "0.85rem" }}>
          {message}
        </div>
      )}

      {/* 장바구니 담기 토스트 */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "6rem", // 플로팅 요약바 위에
            left: 0,
            right: 0,
            margin: "0 auto",
            maxWidth: "480px",
            padding: "0.75rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            color: "#fff",
            fontSize: "0.85rem",
            borderRadius: "999px",
          }}
        >
          <span
            style={{
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast}
          </span>
          <button
            type="button"
            onClick={() => {
              setToast(null);
              router.push("/cart");
            }}
            style={{
              background: "#ffffff",
              color: "#065f46",
              borderRadius: "999px",
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              border: "none",
            }}
          >
            장바구니 보기
          </button>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#d1d5db",
              fontSize: "1rem",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          paddingBottom: "1rem",
        }}
      >
        {products.map((p) => {
          const activeOptionId = selectedOption[p.id] ?? null;
          const qty = quantities[p.id] || 1;
          return (
            <div key={p.id} className="fc-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    {p.category} · {p.unit} 단위
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginBottom: "0.5rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                }}
              >
                {p.options.map((opt) => {
                  const active = activeOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={`fc-chip ${active ? "fc-chip-active" : ""}`}
                      onClick={() => handleSelectOption(p.id, opt.id)}
                    >
                      <span>{opt.name}</span>
                      <span style={{ marginLeft: "0.25rem", color: "#6b7280" }}>
                        ({opt.spec})
                      </span>
                      <span style={{ marginLeft: "0.25rem", fontWeight: 600 }}>
                        {opt.price.toLocaleString()}원
                      </span>
                    </button>
                  );
                })}
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
                    type="button"
                    className="fc-chip"
                    onClick={() => handleQtyChange(p.id, -1)}
                    disabled={qty <= 1}
                    style={
                      qty <= 1
                        ? {
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }
                        : undefined
                    }
                  >
                    -
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    className="fc-chip"
                    onClick={() => handleQtyChange(p.id, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="fc-btn"
                  onClick={() => handleAddToCart(p)}
                >
                  장바구니 담기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 플로팅 장바구니 요약 바 */}
      {cartSummary && cartSummary.itemCount > 0 && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          style={{
            // position: "fixed",
            left: 0,
            right: 0,
            bottom: "0.75rem",
            margin: "0 auto",
            maxWidth: "420px",
            padding: "0.75rem 1rem",
            backgroundColor: "#ffffff",
            borderRadius: "999px",
            border: "2px solid #047857",
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            fontSize: "0.9rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                width: "1.8rem",
                height: "1.8rem",
                borderRadius: "999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#047857",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 700,
              }}
            >
              ▾
            </span>
            <span style={{ fontWeight: 700 }}>
              장바구니({cartSummary.itemCount})
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontWeight: 800 }}>
              {cartSummary.totalAmount.toLocaleString()}원
            </span>
            <span
              style={{
                width: "1.8rem",
                height: "1.8rem",
                borderRadius: "999px",
                border: "1px solid #047857",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.0rem",
              }}
            >
              🛒
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
