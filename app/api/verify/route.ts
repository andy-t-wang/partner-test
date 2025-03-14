export const dynamic = "force-dynamic";
import {NextResponse} from "next/server";
import {ISuccessResult, verifyCloudProof} from "@worldcoin/minikit-js";
import {AbiCoder, toBeHex} from 'ethers';

export async function POST(req: Request) {
    const body = await req.json();
    const result = await verifyProof(
        body,
        body.action,
        body.signal
    );
    console.log("Verification result:", result);

    if (result && result.success) {
        return NextResponse.json({success: true});
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

    const proof = {
        proof: payload.proof,
        merkle_root: payload.merkle_root,
        nullifier_hash: payload.nullifier_hash,
        verification_level: payload.verification_level
    };

    // Unpack the packed proof from its ABI-encoded hex string to a nested proof structure
    try {
        const unpackedProof = decodeProof(proof.proof);
        // Replace the packed proof with the unpacked (nested) proof in the payload
        proof.proof = JSON.stringify(unpackedProof);
    } catch (error) {
        console.error('Error unpacking proof', error);
        throw error;
    }

    console.log("Verifying payload" + JSON.stringify({proof, app_id, action, signal}, null, 2));

    try {

        verifyResponse = await verifyCloudProof(
            proof,
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


// Define the nested proof format type
type NestedProof = [
    [string, string],
    [[string, string], [string, string]],
    [string, string]
];

/**
 * Decodes an ABI-encoded proof into a flat array of hex strings.
 * (Assumes the ABI decoding returns an array of 8 hex strings.)
 */
function decodeAbiEncodedProof(encodedProof: string): string[] {
    const decoded = new AbiCoder().decode(["uint256[8]"], encodedProof)[0] as never[];
    return decoded.map((item: never) => toBeHex(item));
}

/**
 * Unpacks a packed proof (ABI-encoded hex string) into its nested array structure.
 */
function decodeProof(proof: string): NestedProof {
    const flatProof = decodeAbiEncodedProof(proof);
    return [
        [flatProof[0], flatProof[1]],
        [
            [flatProof[2], flatProof[3]],
            [flatProof[4], flatProof[5]]
        ],
        [flatProof[6], flatProof[7]]
    ];
}