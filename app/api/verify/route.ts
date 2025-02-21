import { verifyCloudProof } from "@worldcoin/idkit";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { proof, action, signal } = body;

  const result = await verifyCloudProof(proof, action, signal);
  console.log(result);
  return NextResponse.json(result);
}
