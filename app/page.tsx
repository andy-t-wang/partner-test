"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import WebhookEvents from "./components/WebhookEvents";

// Define VerificationLevel enum since we're no longer importing it
enum VerificationLevel {
  Orb = "orb",
  Device = "device",
  Document = "document",
  SecureDocument = "secure_document",
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

// Define IDKit types
interface IDKitVerifyResponse {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
  action: string;
  signal?: string;
}

interface IDKitInstance {
  init: (config: IDKitConfig) => void;
  open: () => void;
}

interface IDKitConfig {
  signal: string;
  app_id: string;
  action: string;
  action_description: string;
  show_modal: boolean;
  container_id: string;
  partner: boolean;
  verification_level: string;
  handleVerify: (response: IDKitVerifyResponse) => boolean | Promise<boolean>;
  onSuccess: (result: ISuccessResult) => void;
}

declare global {
  interface Window {
    IDKit: IDKitInstance;
  }
}

export default function Home() {
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(
    VerificationLevel.Device
  );
  const idkitContainerRef = useRef<HTMLDivElement>(null);

  const initializeIDKit = useCallback(() => {
    if (window.IDKit && idkitContainerRef.current) {
      try {
        window.IDKit.init({
          signal: "test_signal",
          app_id: "app_staging_4cf2b038f87e0ebdf328ac3b60ded270",
          action: "razer-test",
          action_description: "Verify with World ID",
          show_modal: true,
          container_id: "idkit-container",
          partner: true,
          verification_level: verificationLevel.toString().toLowerCase(),
          handleVerify: (response: IDKitVerifyResponse) => {
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
  }, [verificationLevel]);

  // Initialize IDKit when component mounts and when verification level changes
  useEffect(() => {
    initializeIDKit();
  }, [initializeIDKit]);

  const onSuccess = async (result: ISuccessResult) => {
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        body: JSON.stringify(result),
      });

      const data = await response.json();
      if (data.success) {
        console.log("User verified");
        alert("Account Linked");
      } else {
        console.log("User not verified");
        alert("Proof not verified");
      }
    } catch (error) {
      console.error(
        "Verification error:",
        error instanceof Error ? error.message : String(error)
      );
      alert("Error during verification");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="razer-container p-8 rounded-lg w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-center mb-6 text-[--razer-green]">
              Razer IDKit Demo
            </h1>

            <div className="flex flex-col gap-4">
              <label htmlFor="verification-level" className="razer-label">
                Verification Level
              </label>
              <select
                id="verification-level"
                className="razer-select rounded-md"
                value={verificationLevel}
                onChange={(e) =>
                  setVerificationLevel(e.target.value as VerificationLevel)
                }
              >
                <option value={VerificationLevel.Orb}>Orb</option>
                <option value={VerificationLevel.Device}>Device</option>
              </select>
            </div>

            <div className="flex flex-col items-center mt-4 rounded-lg">
              <div
                id="idkit-container"
                ref={idkitContainerRef}
                className="rounded-lg bg-red-300"
              />

              <button
                onClick={() => {
                  if (window.IDKit) {
                    window.IDKit.open();
                  } else {
                    alert("IDKit is not initialized yet");
                  }
                }}
                className="razer-button mt-6 rounded-md"
              >
                Verify with World ID
              </button>
            </div>
          </div>
        </div>

        {/* Add the WebhookEvents component */}
        <WebhookEvents />
      </main>
    </div>
  );
}
