import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const buildDir = path.join(root, ".portfolio-pages-build");
const outputDir = path.join(root, ".portfolio-pages-out");

function assertWorkspacePath(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(root + path.sep)) {
    throw new Error(`Unsafe path outside workspace: ${resolved}`);
  }
}

function copy(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, source), target);
}

for (const target of [buildDir, outputDir]) {
  assertWorkspacePath(target);
  fs.rmSync(target, { recursive: true, force: true });
}

fs.mkdirSync(path.join(buildDir, "app", "styles"), { recursive: true });
fs.mkdirSync(path.join(buildDir, "app", "portfolio"), { recursive: true });
fs.mkdirSync(path.join(buildDir, "components", "portfolio"), { recursive: true });
fs.mkdirSync(path.join(buildDir, "public"), { recursive: true });

copy("components/portfolio/xintu-portfolio.tsx", path.join(buildDir, "components", "portfolio", "xintu-portfolio.tsx"));
copy("components/portfolio/qwen-case-gallery.tsx", path.join(buildDir, "components", "portfolio", "qwen-case-gallery.tsx"));
copy("components/portfolio/xintu-portfolio.module.css", path.join(buildDir, "components", "portfolio", "xintu-portfolio.module.css"));
copy("app/styles/tokens.css", path.join(buildDir, "app", "styles", "tokens.css"));
copy("app/styles/base.css", path.join(buildDir, "app", "styles", "base.css"));
copy("postcss.config.mjs", path.join(buildDir, "postcss.config.mjs"));
copy("tsconfig.json", path.join(buildDir, "tsconfig.json"));
copy("package.json", path.join(buildDir, "package.json"));

const publicSource = path.join(root, "public", "portfolio");
const publicTarget = path.join(buildDir, "public", "portfolio");
fs.cpSync(publicSource, publicTarget, { recursive: true });

fs.writeFileSync(path.join(buildDir, "app", "globals.css"), `@import "tailwindcss";\n@import "./styles/tokens.css";\n@import "./styles/base.css";\n`);
fs.writeFileSync(path.join(buildDir, "next.config.mjs"), `export default {\n  output: "export",\n  trailingSlash: true,\n  images: { unoptimized: true },\n  basePath: "/XINTU",\n  assetPrefix: "/XINTU",\n};\n`);
fs.writeFileSync(path.join(buildDir, "app", "layout.tsx"), `import type { Metadata } from "next";\nimport "./globals.css";\n\nexport const metadata: Metadata = {\n  title: { default: "XINTU Portfolio", template: "%s | XINTU" },\n  description: "XINTU AI 产品经理与 AI Coding 作品集。",\n};\n\nexport default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {\n  return <html lang="zh-CN"><body>{children}</body></html>;\n}\n`);
fs.writeFileSync(path.join(buildDir, "app", "page.tsx"), `export default function Page() {\n  return <meta httpEquiv="refresh" content="0; url=/XINTU/portfolio/" />;\n}\n`);
fs.writeFileSync(path.join(buildDir, "app", "portfolio", "page.tsx"), `import type { Metadata, Viewport } from "next";\nimport { XintuPortfolio } from "@/components/portfolio/xintu-portfolio";\n\nconst pageUrl = "https://airzhou1zz.github.io/XINTU/portfolio/";\nconst imageUrl = "https://airzhou1zz.github.io/XINTU/portfolio/portfolio-og.png";\n\nexport const metadata: Metadata = {\n  title: "XINTU · AI Product Manager Portfolio",\n  description: "从一个有边界的图像 Agent，到一个可以运行、评估和复现的 AI 修图产品。",\n  alternates: { canonical: pageUrl },\n  openGraph: { type: "website", url: pageUrl, title: "XINTU · AI Product Manager Portfolio", description: "参考图追色、非生成式编辑、有界 Agent 与本地确定性渲染。", images: [{ url: imageUrl, width: 1280, height: 640 }] },\n  twitter: { card: "summary_large_image", title: "XINTU · AI Product Manager Portfolio", description: "让 AI 修图回到可控。", images: [imageUrl] },\n};\n\nexport const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#284f45" };\n\nexport default function PortfolioPage() { return <XintuPortfolio />; }\n`);

const nodeModulesLink = path.join(buildDir, "node_modules");
fs.symlinkSync(path.join(root, "node_modules"), nodeModulesLink, "junction");

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: buildDir,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_PORTFOLIO_BASE_PATH: "/XINTU" },
  stdio: "inherit",
});

if (result.status !== 0) process.exit(result.status ?? 1);

fs.cpSync(path.join(buildDir, "out"), outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, ".nojekyll"), "");
console.log(`Portfolio Pages export ready: ${outputDir}`);