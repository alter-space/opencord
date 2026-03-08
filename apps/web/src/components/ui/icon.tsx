import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";

export function Icon({ size = 16, strokeWidth = 1.2, ...props }: HugeiconsIconProps) {
  return (
    <HugeiconsIcon
      {...props}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth
    />
  );
}

export type { HugeiconsIconProps as IconProps };
