import { NextResponse } from "next/server";
import { syncCKPoolStats } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await syncCKPoolStats(true);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
