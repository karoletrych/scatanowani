import { useEffect } from "react";
import { CheckIcon, CrossIcon } from "./Icons";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export function Toast({
  message,
  tone = "default",
  duration = 3600,
  action,
  onClose,
}: {
  message: string;
  tone?: "default" | "error";
  duration?: number;
  action?: ToastAction;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <div className={`toast toast-${tone}`} role="status">
      <span className="toast-icon">
        {tone === "error" ? <CrossIcon size={16} /> : <CheckIcon size={16} />}
      </span>
      <span className="toast-message">{message}</span>
      {action ? (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            action.onClick();
            onClose();
          }}
        >
          {action.label}
        </button>
      ) : null}
      <button type="button" className="toast-close" onClick={onClose} aria-label="Ukryj">
        ×
      </button>
    </div>
  );
}
