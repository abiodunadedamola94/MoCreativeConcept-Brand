import type { Metadata } from "next";
import AboutContent from "./about-content";

export const metadata: Metadata = {
  title: "About — Abiodun Adedamola · MoCreativeConcept",
  description:
    "AI Product Designer, Motion Designer and Builder-Designer. Brand identity, mission, skills and experience.",
};

export default function AboutPage() {
  return <AboutContent />;
}
