import React from "react";

  export function LoadingSpinner({ label = "Loading..." }) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-2">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        ></div>
        {label && <p className="text-sm" style={{ color: "var(--muted)" }}>{label}</p>}
      </div>
    );
  }

  export default LoadingSpinner;