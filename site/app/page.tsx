import type { Metadata } from "next";
import HomeContent from "./home-content";

export const metadata: Metadata = {
  title: "MoCreativeConcept — Abiodun Adedamola",
  description:
    "AI Product Designer, Motion Designer and Builder-Designer based in Lagos.",
};

export default function Home() {
  return <HomeContent />;
}
