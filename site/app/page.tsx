import type { Metadata } from "next";
import Script from "next/script";
import "./scrollcraft.css";
import "./brand-tokens.css";
import "./brand-page.css";
import { BRAND_MARKUP } from "./brand-markup";

export const metadata: Metadata = {
  title: "MoCreative Concept. · Product design that ships, AI automation that runs",
  description:
    "MoCreative Concept is Abiodun Adedamola David's AI-native practice with two pillars: product design taken from brief to deployed code, and AI automation consulting for teams and schools.",
};

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: BRAND_MARKUP }} />
      <Script src="/mo-core.js" strategy="afterInteractive" />
      <Script src="/home.js" strategy="afterInteractive" />
    </>
  );
}
