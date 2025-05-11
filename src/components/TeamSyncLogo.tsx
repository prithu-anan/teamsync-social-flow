
import { SVGProps } from "react";

interface TeamSyncLogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const TeamSyncLogo = ({ className, ...props }: TeamSyncLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
      <path d="M20 16.2A5 5 0 0 0 16.8 13" />
      <path d="M17 8.7A5 5 0 0 0 20 11" />
    </svg>
  );
};

export default TeamSyncLogo;
