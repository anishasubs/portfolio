"use client";

import type { ReactNode } from "react";

interface DiscoveryKitCTAProps {
  children?: ReactNode;
}

export default function DiscoveryKitCTA({ children }: DiscoveryKitCTAProps) {
  return (
    <div className="mb-5 animate-fadeUp">
      <div
        className="rounded-[24px] p-5 pb-6 shadow-[0_8px_40px_rgba(0,40,80,0.1)]"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(226,240,250,0.88) 50%, rgba(200,228,248,0.85) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3 className="font-shrikhand text-[20px] text-[#1B3A5C] leading-tight text-center mb-1">
          Your Discovery Kit is ready
        </h3>

        <p className="text-[12px] text-[#4A6B8A] leading-relaxed text-center max-w-[300px] mx-auto mb-4">
          3 capsules + one whifff matched to your scent profile
        </p>

        {/* Recommendation cards live here */}
        {children}

        <button
          className="bp block w-full mt-4 py-[15px] rounded-full text-white text-sm font-extrabold tracking-wide shadow-[0_4px_20px_rgba(74,142,194,0.35)]"
          style={{
            background: "linear-gradient(135deg, #4A8EC2 0%, #6BA8D8 100%)",
          }}
          onClick={() => {
            // placeholder — will wire to order flow
          }}
        >
          Order Your Kit &mdash; $50
        </button>
      </div>
    </div>
  );
}
