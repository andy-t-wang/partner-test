"use client";
import {
  IDKitWidget,
  ISuccessResult,
  VerificationLevel,
} from "@worldcoin/idkit";
import { useState } from "react";

export default function Home() {
  const [verificationLevel, setVerificationLevel] = useState(
    VerificationLevel.Orb
  );

  const onSuccess = async (result: ISuccessResult) => {
    const response = await fetch("/api/verify", {
      method: "POST",
      body: JSON.stringify(result),
    });

    const data = await response.json();
    if (data.success) {
      console.log("User verified");
      alert("Proof verified");
    } else {
      console.log("User not verified");
      alert("Proof not verified");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col gap-4">
          <label htmlFor="verification-level" className="text-sm font-medium">
            Verification Level:
          </label>
          <select
            id="verification-level"
            className="border rounded p-2"
            value={verificationLevel}
            onChange={(e) =>
              setVerificationLevel(e.target.value as VerificationLevel)
            }
          >
            <option value={VerificationLevel.Orb}>Orb</option>
            <option value={VerificationLevel.Device}>Device</option>
            <option value={VerificationLevel.Document}>Document</option>
            <option value={VerificationLevel.SecureDocument}>
              Secure Document
            </option>
          </select>
        </div>
        <IDKitWidget
          app_id="app_staging_4cf2b038f87e0ebdf328ac3b60ded270" // Staging Dev Portal
          action="razer-test" // Staging Dev Portal
          onSuccess={onSuccess}
          verification_level={verificationLevel}
          partner={false}
        >
          {({ open }) => (
            <button
              onClick={open}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              Verify with World ID
            </button>
          )}
        </IDKitWidget>
      </main>
    </div>
  );
}
