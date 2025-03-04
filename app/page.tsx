"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from 'next/image';

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
  // Remove the state for verification level and hardcode it to Device
  const verificationLevel = VerificationLevel.Device;
  const [isVerified, setIsVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Add a new state for verification status
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const idkitContainerRef = useRef<HTMLDivElement>(null);

  const initializeIDKit = useCallback(() => {
    if (window.IDKit && idkitContainerRef.current) {
      try {
        window.IDKit.init({
          signal: "test_signal",
          app_id: "app_staging_4cf2b038f87e0ebdf328ac3b60ded270",
          action: "lazer-test",
          action_description: "Verify with World ID",
          show_modal: false,
          container_id: "idkit-container",
          partner: true,
          verification_level: "device", // Hardcoded to device
          handleVerify: (response: IDKitVerifyResponse) => {
            // verify the IDKit proof, throw an error to show the error screen
            console.log("Verifying:", response);
            setIsProcessing(true);
            return true; // Return true to proceed with success, or throw an error to show error screen
          },
          onSuccess: onSuccess,
        });
      } catch (error) {
        console.error("Error initializing IDKit:", error);
      }
    }
  }, []); // Remove verificationLevel from dependency array

  useEffect(() => {
    // Add the script to the document
    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/andy-idkit-standalone@1.4.4/build/index.global.js";
    script.async = true;
    script.onload = initializeIDKit;

    document.body.appendChild(script);

    return () => {
      // Cleanup
      document.body.removeChild(script);
    };
  }, [initializeIDKit]);

  // Re-initialize IDKit when verification level changes - remove this effect since level is now fixed
  useEffect(() => {
    if (window.IDKit) {
      initializeIDKit();
    }
  }, []); // Remove verificationLevel from dependency array

  const onSuccess = async (result: ISuccessResult) => {
    try {
      setIsProcessing(true);
      const response = await fetch("/api/verify", {
        method: "POST",
        body: JSON.stringify(result),
      });

      const data = await response.json();
      if (data.success) {
        console.log("User verified");
        // Instead of setting isVerified to true, set the verification status to pending
        setVerificationStatus('pending');

        // Simulate a webhook response after 5 seconds (for demo purposes)
        // In a real application, this would be triggered by an actual webhook
        setTimeout(() => {
          setVerificationStatus('verified');
        }, 5000);
      } else {
        console.log("User not verified");
        setVerificationStatus('none');
        alert("Proof not verified");
      }
    } catch (error) {
      console.error(
        "Verification error:",
        error instanceof Error ? error.message : String(error)
      );
      alert("Error during verification");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = () => {
    const date = new Date();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black py-4 border-b border-[#333333]">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#44d62c" />
              <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#44d62c" fillOpacity="0.5" />
            </svg>
            <h1 className="text-xl font-bold tracking-wider">LAZER ID</h1>
          </div>
          <nav>
            <a href="https://www.lazer.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z" />
                <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6Z" />
              </svg>
              lazer.com
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="font-bold text-4xl mb-4 text-[#44d62c] tracking-wider">WORLD ID</h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">A privacy-first identity protocol to protect your data online.</p>
        </div>

        <div className="page-world-id">
          {verificationStatus === 'verified' ? (
            <div className="card max-w-lg mx-auto verified-section">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#44d62c] bg-opacity-20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#44d62c" viewBox="0 0 16 16">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
                  </svg>
                </div>
              </div>

              <div className="info text-center">
                <h3 className="text-2xl font-bold mb-2 text-[#44d62c] tracking-wider">HUMAN VERIFIED</h3>
                <div className="status-verified flex justify-center items-center gap-2 mb-2">
                  <span>Status:</span>
                  <span className="text-[#44d62c] font-semibold">✓ VERIFIED</span>
                </div>
                <div className="date-verified mb-6">
                  <span>Date Verified: </span>
                  <span className="date">{formatDate()}</span>
                </div>
              </div>

              <div className="buttons-form flex flex-col gap-3">
                <button
                  onClick={() => setVerificationStatus('none')}
                  className="bg-[#44d62c] text-black hover:bg-[#7dfc65] px-6 py-3 rounded-none font-medium transition-all duration-200 shadow-sm uppercase tracking-wider"
                >
                  Verify Again
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="border border-[#44d62c] text-[#44d62c] hover:bg-[#44d62c] hover:text-black px-6 py-3 rounded-none font-medium transition-all duration-200 shadow-sm uppercase tracking-wider"
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
              </div>

              {showDetails && (
                <div className="mt-6 border-t border-[#333333] pt-4 text-xs opacity-70">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Verification Level:</div>
                    <div>{verificationLevel}</div>
                    <div>App ID:</div>
                    <div>app_staging_4cf2b038f87e0ebdf328ac3b60ded270</div>
                    <div>Action:</div>
                    <div>lazer-test</div>
                  </div>
                </div>
              )}
            </div>
          ) : verificationStatus === 'pending' ? (
            <div className="card max-w-lg mx-auto verified-section">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[#44d62c] bg-opacity-20 flex items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-[#44d62c]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>

              <div className="info text-center">
                <h3 className="text-2xl font-bold mb-2 text-[#44d62c] tracking-wider">ACCOUNT LINKED</h3>
                <div className="status-verified flex justify-center items-center gap-2 mb-2">
                  <span>Status:</span>
                  <span className="text-[#44d62c] font-semibold">AWAITING VERIFICATION</span>
                </div>
                <div className="date-verified mb-6">
                  <span>Date Linked: </span>
                  <span className="date">{formatDate()}</span>
                </div>
              </div>

              <div className="text-center mt-4 mb-6">
                <p className="opacity-80">Your account has been linked. Please wait while we verify your identity.</p>
              </div>
            </div>
          ) : (
            <div className="card max-w-lg mx-auto verify-modal">
              <div className="flex items-center gap-3 mb-8 page-title">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#44d62c" />
                  <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="#44d62c" fillOpacity="0.5" />
                </svg>
                <h3 className="text-2xl font-bold text-[#44d62c] tracking-wider">VERIFY WITH WORLD ID</h3>
              </div>

              <div className="page-description mb-8">
                <p className="mb-4">Verify your unique human identity with World ID to securely access this account.</p>
                <ul className="list-disc pl-5 space-y-2 opacity-80">
                  <li>Protection against bots and fake accounts</li>
                  <li>Enhanced account security</li>
                  <li>No personal data shared during verification</li>
                </ul>
              </div>

                  {/* Replace IDKitWidget with a container div for the standalone IDKit */}
                  <div className="flex flex-col">
                    <div id="idkit-container" ref={idkitContainerRef}></div>

                    <div className="verify-link mt-4">
                      {/* Adding a manual button in case automatic initialization doesn't work */}
                      <button
                        onClick={() => {
                          if (window.IDKit) {
                            window.IDKit.open();
                          } else {
                            alert("IDKit is not initialized yet");
                          }
                        }}
                        disabled={isProcessing}
                        className="bg-[#44d62c] text-black hover:bg-[#7dfc65] px-6 py-3 rounded-none font-medium transition-all duration-200 shadow-sm w-full flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        {isProcessing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                              <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" fill="currentColor" fillOpacity="0.5" />
                            </svg>
                              Verify with World ID
                          </>
                        )}
                      </button>
                  <span className="block text-center mt-3 text-sm opacity-70">You will be temporarily redirected to World ID</span>
                </div>
              </div>

              <div className="disclaimer mt-8 text-xs opacity-70 border-t border-[#333333] pt-4">
                <p className="mb-2">By proceeding, you agree to lazer's Terms of Service and Privacy Policy.</p>
                <p>Disclosure: lazer receives payment from World per user verified.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#333333] bg-black">
        <div className="container mx-auto px-4 text-center text-xs opacity-60">
          <p>© 2023 lazer Inc. All rights reserved. This is a demo application showcasing World ID verification.</p>
        </div>
      </footer>
    </div>
  );
}
