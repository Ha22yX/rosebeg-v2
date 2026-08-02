import type { ImgHTMLAttributes } from "react";

export type XpIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "width" | "height"> & {
  size?: number;
};

export function XpIcon({ alt = "", size = 16, ...props }: XpIconProps) {
  return <img alt={alt} height={size} width={size} {...props} />;
}
