import { NextResponse } from "next/server";
import { reviewRequestSchema, visualReviewSchema } from "@/lib/agent/visual-review";
import { reviewWithFallback } from "@/lib/ai/provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const maxBytes = Number(process.env.MAX_IMAGE_MB || 15) * 1024 * 1024;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > maxBytes * 2) {
    return NextResponse.json({ error: "复核请求过大，请压缩图片后重试。" }, { status: 413 });
  }

  try {
    const payload = reviewRequestSchema.parse(await request.json());
    if (Buffer.byteLength(payload.imageDataUrl, "utf8") > maxBytes) {
      return NextResponse.json({ error: "复核图片超过大小限制。" }, { status: 413 });
    }
    const result = await reviewWithFallback(payload);
    return NextResponse.json(visualReviewSchema.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `视觉复核失败：${message}` }, { status: 400 });
  }
}