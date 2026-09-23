import type { Metadata } from "next";
import Script from "next/script";
import "../brand-tokens.css";
import "./invoice.css";
import { INVOICE_MARKUP } from "./invoice-markup";

export const metadata: Metadata = {
  title: "Invoice — MoCreative Concept",
  description: "Invoice from MoCreative Concept.",
  robots: { index: false, follow: false },
};

export default function InvoicePage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: INVOICE_MARKUP }} />
      <Script src="/invoice.js" strategy="afterInteractive" />
    </>
  );
}
