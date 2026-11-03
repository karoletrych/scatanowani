import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function MeepleIcon({ size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <circle cx="12" cy="5.2" r="2.9" />
      <path d="M12 8.4c2.6 0 4.6 2 4.6 4.6v1.4c0 .8-.7 1.5-1.5 1.5h-1.2v3.6c0 .8-.7 1.5-1.5 1.5h-.8c-.8 0-1.5-.7-1.5-1.5v-3.6H8.9c-.8 0-1.5-.7-1.5-1.5V13c0-2.6 2-4.6 4.6-4.6Z" />
    </svg>
  );
}

export function DiceIcon({ size = 20, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.2" />
      <circle cx="8.4" cy="8.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="8.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.4" cy="15.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.6" cy="15.6" r="1.15" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function CheckIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.4}>
      <path d="m4.5 12.5 4.6 4.6L19.5 6.7" />
    </Base>
  );
}

export function CrossIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.4}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function QuestionIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.2}>
      <path d="M9.2 9a2.9 2.9 0 1 1 4.3 2.6c-.9.5-1.5 1.1-1.5 2.2" />
      <circle cx="12" cy="17.6" r="1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function LockIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <rect x="4.5" y="10" width="15" height="10.5" rx="2.6" />
      <path d="M8 10V7.6a4 4 0 0 1 8 0V10" />
    </Base>
  );
}

export function UsersIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <circle cx="9" cy="8.2" r="3.2" />
      <path d="M3.4 19.4c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2" />
      <path d="M16 5.4a3 3 0 0 1 0 5.7M17.4 14.7c2 .6 3.3 2.3 3.3 4.7" />
    </Base>
  );
}

export function CalendarIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.6h17M8.2 3.4v3.2M15.8 3.4v3.2" />
    </Base>
  );
}

export function SettingsIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l1.6-1.2-1.9-3.3-1.9.8a7.6 7.6 0 0 0-2.6-1.5L14.3 3h-3.8l-.3 2.3a7.6 7.6 0 0 0-2.6 1.5l-1.9-.8-1.9 3.3 1.6 1.2a7.7 7.7 0 0 0 0 3l-1.6 1.2 1.9 3.3 1.9-.8a7.6 7.6 0 0 0 2.6 1.5l.3 2.3h3.8l.3-2.3a7.6 7.6 0 0 0 2.6-1.5l1.9.8 1.9-3.3Z" />
    </Base>
  );
}

export function PlusIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function TrashIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <path d="M4.5 7h15M9.5 7V4.6h5V7M6.5 7l.9 12.1c.1.8.7 1.4 1.5 1.4h6.2c.8 0 1.4-.6 1.5-1.4L17.5 7" />
      <path d="M10.2 11v5.6M13.8 11v5.6" />
    </Base>
  );
}

export function CloseIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function ClockIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.3V12l3.2 2" />
    </Base>
  );
}

export function PinIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <path d="M12 21s6.4-5.3 6.4-10.2A6.4 6.4 0 0 0 5.6 10.8C5.6 15.7 12 21 12 21Z" />
      <circle cx="12" cy="10.6" r="2.4" />
    </Base>
  );
}

export function SparkIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <path d="M12 3.2 13.8 9l5.8 1.8-5.8 1.8L12 18.4l-1.8-5.8L4.4 10.8 10.2 9Z" />
      <path d="M18.4 16.6 19.2 19l2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z" />
    </Base>
  );
}

export function CrownIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <path d="M4 17.5 3.2 7l4.9 3.6L12 4.6l3.9 6L20.8 7l-.8 10.5Z" />
      <path d="M4.6 14.8h14.8" />
    </Base>
  );
}

export function ChevronIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.2}>
      <path d="m6 9.5 6 6 6-6" />
    </Base>
  );
}

export function RefreshIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <path d="M20 11.5A8 8 0 0 0 6.2 6.2L4 8.4M4 4.5v3.9h3.9M4 12.5a8 8 0 0 0 13.8 5.3l2.2-2.2M20 19.5v-3.9h-3.9" />
    </Base>
  );
}

export function ArrowIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest} strokeWidth={2.1}>
      <path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />
    </Base>
  );
}

export function InfoIcon({ size = 18, ...rest }: IconProps) {
  return (
    <Base size={size} {...rest}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5M12 7.8v.4" />
    </Base>
  );
}
