import type { Metadata, Viewport } from "next";
import { XintuPortfolio } from "@/components/portfolio/xintu-portfolio";

const portfolioUrl = "https://airzhou1zz.github.io/XINTU/portfolio/";

export const metadata: Metadata = {
  metadataBase: new URL("https://airzhou1zz.github.io"),
  title: "XINTU · AI Product Manager Portfolio",
  description: "从一个有边界的图像 Agent，到一个可以运行、评估和复现的 AI 修图产品。XINTU AI 产品经理 / AI Coding 作品集。",
  alternates: { canonical: portfolioUrl },
  openGraph: {
    type: "website",
    url: portfolioUrl,
    title: "XINTU · AI Product Manager Portfolio",
    description: "参考图追色、非生成式编辑、有界 Agent 与本地确定性渲染。",
    siteName: "XINTU",
    images: [
      {
        url: "https://airzhou1zz.github.io/XINTU/portfolio/portfolio-og.png",
        width: 1280,
        height: 640,
        alt: "XINTU AI Product Manager Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XINTU · AI Product Manager Portfolio",
    description: "让 AI 修图回到可控：一个非生成式的有界图像 Agent。",
    images: ["https://airzhou1zz.github.io/XINTU/portfolio/portfolio-og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#284f45",
};

export default function PortfolioPage() {
  return <XintuPortfolio />;
}