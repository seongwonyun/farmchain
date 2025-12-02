import type { Metadata } from "next";
import "../styles/globals.css";
import { BottomNav } from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "팜체인 - 농산물 발주",
  description: "유통사를 위한 농산물 발주/배차 관리 서비스 (Supabase 연동)"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div style={{ paddingBottom: "56px" }}>{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}