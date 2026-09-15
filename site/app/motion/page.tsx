import type { Metadata } from "next";
import MotionContent from "./motion-content";

export const metadata: Metadata = {
  title: "Motion & Animation — MoCreativeConcept",
  description:
    "Figma-native product motion, brand animation, and interaction design by Abiodun Adedamola.",
};

export default function MotionPage() {
  return <MotionContent />;
}
