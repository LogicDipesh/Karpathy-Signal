import { NextResponse } from "next/server";
import { fetchSignals } from "../../../lib/fetchSignals";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const results = await fetchSignals();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to process feed." }, { status: 500 });
  }
}
