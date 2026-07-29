import { cn } from "@/lib/utils";
import { getAIEmployeeAvatar, type AIEmployee } from "../../providers";
import type { CSSProperties } from "react";

export function AIEmployeeAvatar({
  employee,
  flip = false,
  className,
  style,
}: {
  employee?: AIEmployee;
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full bg-transparent",
        className
      )}
      style={style}
    >
      <img
        src={getAIEmployeeAvatar(employee?.avatar, { flip })}
        alt={employee?.nickname ?? "AI employee"}
        className="size-full object-cover"
      />
    </span>
  );
}
