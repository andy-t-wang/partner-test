"use client";
import { useEffect, useState, useRef } from "react";

// Define VerificationLevel enum since we're no longer importing it
enum VerificationLevel {
  Orb = "orb",
  Device = "device",
  Document = "document",
  SecureDocument = "secure_document"
}

// Define the interface for the success result
interface ISuccessResult {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
  signal: string;
  action: string;
}

declare global {
  interface Window {
    IDKit: any;
  }
}

export default function Home() {
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(
    VerificationLevel.Orb
  );
  const idkitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add the script to the document
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/andy-idkit-standalone@1.4.4/build/index.global.js';
    script.async = true;
    script.onload = initializeIDKit;

    document.body.appendChild(script);

    return () => {
      // Cleanup
      document.body.removeChild(script);
    };
  }, []);

  const initializeIDKit = () => {
    if (window.IDKit && idkitContainerRef.current) {
      try {
        window.IDKit.init({
          signal: 'test_signal',
          app_id: 'app_staging_4cf2b038f87e0ebdf328ac3b60ded270', // Keeping your current app_id
          action: 'razer-test', // Keeping your current action
          action_description: 'Verify with World ID',
          show_modal: false,
          container_id: 'idkit-container',
          partner: true,
          verification_level: verificationLevel.toString().toLowerCase(),
          handleVerify: (response: any) => {
            // verify the IDKit proof, throw an error to show the error screen
            console.log("Verifying:", response);
            return true; // Return true to proceed with success, or throw an error to show error screen
          },
          onSuccess: onSuccess,
        });
      } catch (error) {
        console.error("Error initializing IDKit:", error);
      }
    }
  };

  // Re-initialize IDKit when verification level changes
  useEffect(() => {
    if (window.IDKit) {
      initializeIDKit();
    }
  }, [verificationLevel]);

  const onSuccess = async (result: ISuccessResult) => {
    try {
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
    } catch (error) {
      console.error("Verification error:", error);
      alert("Error during verification");
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

        {/* Replace IDKitWidget with a container div for the standalone IDKit */}
        <div className="flex flex-col items-center">
          <div id="idkit-container" ref={idkitContainerRef}></div>

          {/* Adding a manual button in case automatic initialization doesn't work */}
          <button
            onClick={() => {
              if (window.IDKit) {
                window.IDKit.open();
              } else {
                alert("IDKit is not initialized yet");
              }
            }}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
          >
            Verify with World ID
          </button>
        </div>
      </main>
    </div>
  );
}
