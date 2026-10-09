import { NextRequest, NextResponse } from "next/server";
import { syncCKPoolStats } from "@/lib/sync";
import { DEFAULT_BTC_ADDRESS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let address = DEFAULT_BTC_ADDRESS;
    const { searchParams } = new URL(request.url);
    const queryAddress = searchParams.get("address");

    if (queryAddress && queryAddress.trim()) {
      address = queryAddress.trim();
    } else {
      try {
        const body = await request.json();
        if (body?.address && typeof body.address === "string" && body.address.trim()) {
          address = body.address.trim();
        }
      } catch {
        // body might be empty, use default or query
      }
    }

    const result = await syncCKPoolStats(true, undefined, address);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
