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
  disable_default_modal_behavior: boolean;
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
  const [signalId, setSignalId] = useState<string>("");
  const idkitContainerRef = useRef<HTMLDivElement>(null);
  // Add a ref to store the verification response
  const verificationResponseRef = useRef<IDKitVerifyResponse | null>(null);

  // Generate a UUID for the signal when component mounts
  useEffect(() => {
    // Use crypto.randomUUID() to generate a UUID
    if (typeof window !== 'undefined' && window.crypto) {
      setSignalId(crypto.randomUUID());
    }
  }, []);

  const initializeIDKit = useCallback(() => {
    if (window.IDKit && idkitContainerRef.current && signalId) {
      try {
        window.IDKit.init({
          signal: signalId,
          app_id: "app_staging_4cf2b038f87e0ebdf328ac3b60ded270",
          action: "razer-test",
          action_description: "Verify with World ID",
          show_modal: true,
          container_id: "idkit-container",
          disable_default_modal_behavior: true,
          partner: true,
          verification_level: verificationLevel.toString().toLowerCase(),
          handleVerify: (response: IDKitVerifyResponse) => {
            // verify the IDKit proof, throw an error to show the error screen
            console.log("Verifying:", response);
            // Store the response in the ref for later use
            verificationResponseRef.current = response;
            return true; // Return true to proceed with success, or throw an error to show error screen
          },
          onSuccess: onSuccess,
        });
      } catch (error) {
        console.error("Error initializing IDKit:", error);
      }
    }
  }, [verificationLevel, signalId]);

  // Initialize IDKit when component mounts and when verification level or signalId changes
  useEffect(() => {
    if (signalId) {
      initializeIDKit();
    }
  }, [initializeIDKit, signalId]);

  const onSuccess = async (result: ISuccessResult) => {
    try {
      // Use the stored verification response if available, but ensure all required fields are present
      const dataToSend = {
        ...(verificationResponseRef.current || {}),
        ...result,
        // Explicitly include verification_level to ensure it's present
        verification_level: verificationLevel.toString().toLowerCase(),
        // Explicitly include action and signal to ensure they're present
        action: "razer-test", // Must match the action used in IDKit initialization
        signal: signalId // Use the same signalId that was used for initialization
      };

      // Show a loading message or indicator
      console.log("Verifying proof with server...");

      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      if (data.success) {
        // Only show success message when the server verification succeeds
        console.log("User verified successfully by server");
        alert("Account Linked");
      } else {
        console.log("Server verification failed");
        console.log("Verification error details:", data);
        alert("Proof not verified by server");
      }
    } catch (error) {
      console.error(
        "Verification error:",
        error instanceof Error ? error.message : String(error)
      );
      alert("Error during server verification");
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
