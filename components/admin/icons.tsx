import type { SVGProps } from "react";

/**
 * Pictogrammes de l’espace admin, dessinés au trait. Ils accompagnent toujours
 * un libellé en toutes lettres : une icône seule ne dit rien à qui ne connaît
 * pas les conventions des applications.
 */
const PATHS = {
  alert: "M12 3.5 21.5 20h-19zM12 10v4.5M12 17.3v.1",
  back:"M19 12H5M11 6l-6 6 6 6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  code: "M9 7l-5 5 5 5M15 7l5 5-5 5",
  down: "M12 5v14M6 13l6 6 6-6",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  forward: "M5 12h14M13 6l6 6-6 6",
  heading: "M6 5v14M18 5v14M6 12h12",
  pen: "M4 20h4L20 8l-4-4L4 16zM14 6l4 4",
  plus: "M12 5v14M5 12h14",
  search: "M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM16 16l4.5 4.5",
  trash: "M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13",
  up: "M12 19V5M6 11l6-6 6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = "1.25em", ...props }: { name: IconName; size?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: "none" }}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
