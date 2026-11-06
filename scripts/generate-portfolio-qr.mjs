import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const portfolioUrl = "https://airzhou1zz.github.io/XINTU/portfolio/";
const outputDir = path.join(process.cwd(), "docs");
fs.mkdirSync(outputDir, { recursive: true });

const options = {
  errorCorrectionLevel: "H",
  margin: 4,
  width: 1024,
  color: {
    dark: "#173B34",
    light: "#FFF9EB",
  },
};

const png = await QRCode.toBuffer(portfolioUrl, { ...options, type: "png" });
const svg = await QRCode.toString(portfolioUrl, { ...options, type: "svg" });
const qr = QRCode.create(portfolioUrl, { errorCorrectionLevel: "H" });

const cardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1320" viewBox="0 0 1200 1320">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#E8EFE4"/>
      <stop offset="0.52" stop-color="#F3ECDE"/>
      <stop offset="1" stop-color="#E5D8E9"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".74" numOctaves="3" seed="11"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 .08"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1200" height="1320" fill="url(#bg)"/>
  <ellipse cx="1030" cy="130" rx="310" ry="230" fill="#B7A4D4" opacity=".32"/>
  <ellipse cx="110" cy="1170" rx="360" ry="260" fill="#86A994" opacity=".25"/>
  <rect width="1200" height="1320" filter="url(#grain)"/>
  <rect x="88" y="74" width="1024" height="1168" rx="42" fill="#FBF7EC" fill-opacity=".84" stroke="#FFFDF5" stroke-width="2"/>
  <text x="128" y="154" font-family="Georgia, serif" font-style="italic" font-size="70" font-weight="700" letter-spacing="-4" fill="#173B34">XINTU</text>
  <text x="128" y="194" font-family="Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="3.2" fill="#4B6D61">AI PRODUCT MANAGER · AI CODING PORTFOLIO</text>
  <image href="data:image/png;base64,${png.toString("base64")}" x="230" y="245" width="740" height="740"/>
  <text x="600" y="1064" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="#173B34">让 AI 修图回到“可控”</text>
  <text x="600" y="1108" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#4B6D61">参考图追色 · 非生成式编辑 · 有界 Agent · 本地确定性渲染</text>
  <text x="600" y="1172" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="2" fill="#173B34">SCAN TO EXPLORE</text>
  <text x="600" y="1204" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6B5A77">airzhou1zz.github.io/XINTU/portfolio/</text>
</svg>`;

fs.writeFileSync(path.join(outputDir, "resume-qr.png"), png);
fs.writeFileSync(path.join(outputDir, "resume-qr.svg"), svg);
fs.writeFileSync(path.join(outputDir, "resume-qr-card.svg"), cardSvg);
await sharp(Buffer.from(cardSvg)).png({ compressionLevel: 9 }).toFile(path.join(outputDir, "resume-qr-card.png"));
console.log(`QR generated: ${portfolioUrl}`);
console.log(`Modules: ${qr.modules.size}x${qr.modules.size}, version ${qr.version}`);