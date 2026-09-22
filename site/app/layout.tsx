import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MoCreativeConcept — Abiodun Adedamola",
  description:
    "AI Product Designer, Motion Designer and Builder-Designer based in Lagos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* theme before paint, so the page never flashes the wrong mode */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var t=(location.search.match(/[?&]theme=(light|dark)/)||[])[1];if(!t){try{t=localStorage.getItem('mo-theme')}catch(e){}}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.setAttribute('data-theme',t)})();",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
