import { useId, type ReactNode } from "react";

interface InfoTipProps {
  children: ReactNode;
  text: string;
  className?: string;
  edge?: "left" | "right";
  marker?: boolean;
}

export default function InfoTip({
  children,
  text,
  className = "",
  edge = "left",
  marker = true,
}: InfoTipProps) {
  const id = useId();
  return (
    <span
      className={`info-tip ${edge === "right" ? "info-tip-right" : ""} ${className}`.trim()}
      tabIndex={0}
      aria-describedby={id}
    >
      {children}
      {marker && (
        <span className="info-tip-mark" aria-hidden="true">
          i
        </span>
      )}
      <span className="info-tip-popup" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}
