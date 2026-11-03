import { useEffect } from "react";
import { CheckIcon, CrossIcon } from "./Icons";

export function Toast({
  message,
  tone = "default",
  onClose,
}: {
  message: string;
  tone?: "default" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="toast-icon">
        {tone === "error" ? <CrossIcon size={16} /> : <CheckIcon size={16} />}
      </span>
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Ukryj">
        ×
      </button>
    </div>
  );
}
