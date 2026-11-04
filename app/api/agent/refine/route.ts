import { NextResponse } from "next/server";
import { refineRequestSchema } from "@/lib/agent/schema";
import { refineWithFallback } from "@/lib/ai/provider";
import { refineResponseSchema } from "@/lib/color/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = refineRequestSchema.parse(await request.json());
    const result = await refineWithFallback(payload);
    return NextResponse.json(refineResponseSchema.parse(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ error: `修正失败：${message}` }, { status: 400 });
  }
}
