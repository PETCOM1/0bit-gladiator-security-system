"use client";

import MarketingNav from "@/shared/components/layout/MarketingNav";
import Footer from "@/shared/components/layout/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#080c18", minHeight: "100vh" }}>
      <MarketingNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
