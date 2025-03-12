export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { ISuccessResult, verifyCloudProof } from "@worldcoin/minikit-js";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await verifyProof(
    body,
    body.action,
    body.signal
  );
  console.log("Verification result:", result);

  if (result && result.success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({
      success: false,
      error: result ? result.code : "unknown_error",
      details: result || "No result from verification"
    });
  }
}

const verifyProof = async (payload: ISuccessResult, action: string, signal: string | undefined) => {
  let verifyResponse = null;
  const app_id = 'app_staging_4cf2b038f87e0ebdf328ac3b60ded270';
  const stagingEndpoint = `https://staging-developer.worldcoin.org/api/v2/verify/${app_id}`;

  try {
    verifyResponse = await verifyCloudProof(
      payload,
      app_id,
      action,
      signal,
      stagingEndpoint
    );
    console.log('verifyResponse', JSON.stringify(verifyResponse, null, 2));
  } catch (error) {
    console.error('Error in verifyCloudProof', error);
  }
  return verifyResponse;
};
