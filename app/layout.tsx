import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xintu-demo.vercel.app"),
  title: {
    default: "XINTU | Agentic Color Grading",
    template: "%s | XINTU",
  },
  description: "XINTU 是一个有界 Agentic Color Grading Workflow：动态规划、结果评估与确定性本地渲染。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}