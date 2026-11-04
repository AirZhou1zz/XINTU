import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/lib/agent/schema";
import { analyzeWithFallback } from "@/lib/ai/provider";
import { analyzeResponseSchema } from "@/lib/color/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const maxBytes = Number(process.env.MAX_IMAGE_MB || 15) * 1024 * 1024;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes * 2) {
    return NextResponse.json({ error: "请求体过大，请压缩图片后重试。" }, { status: 413 });
  }

  try {
    const payload = analyzeRequestSchema.parse(await request.json());
    if (Buffer.byteLength(payload.imageDataUrl, "utf8") > maxBytes) {
      return NextResponse.json({ error: "目标图片超过大小限制。" }, { status: 413 });
    }
    if (payload.referenceDataUrl && Buffer.byteLength(payload.referenceDataUrl, "utf8") > maxBytes) {
      return NextResponse.json({ error: "参考图超过大小限制。" }, { status: 413 });
    }

    const result = await analyzeWithFallback(payload);
    return NextResponse.json(analyzeResponseSchema.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `分析失败：${message}` }, { status: 400 });
  }
}
