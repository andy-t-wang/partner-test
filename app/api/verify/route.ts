export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("here");
  const body = await req.json();
  const { proof, action, signal } = body;
  console.log(proof, action, signal);
  // const result = await verifyCloudProof(proof, action, signal);
  // console.log(result);
  // TODO:
  return NextResponse.json({ success: true });
}
