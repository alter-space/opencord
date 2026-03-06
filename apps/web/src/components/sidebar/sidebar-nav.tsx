import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SidebarNav({
  currentArea,
  rail,
  panel,
}: {
  currentArea: "home" | "server";
  rail: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div
      className={cn(
        "h-full overflow-hidden transition-[width] duration-300",
        currentArea ? "w-[4.5rem] md:w-80" : "w-[4.5rem]",
      )}
    >
      <nav className="grid size-full grid-cols-[4.5rem] border-r border-border bg-background md:grid-cols-[4.5rem_1fr]">
        <div className="border-r border-border bg-background">{rail}</div>
        <div className="relative hidden min-w-0 overflow-hidden bg-card/20 md:block">{panel}</div>
      </nav>
    </div>
  );
}

export function SidebarArea({
  visible,
  direction,
  motion = "full",
  blur = false,
  children,
}: PropsWithChildren<{
  visible: boolean;
  direction: "left" | "right";
  motion?: "full" | "inset";
  blur?: boolean;
}>) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-y-auto transition-[opacity,translate,filter] duration-300",
        visible
          ? cn("translate-x-0", blur && "blur-0")
          : cn(
              "pointer-events-none opacity-0",
              blur && "blur-[2px]",
              motion === "inset"
                ? direction === "left"
                  ? "-translate-x-6"
                  : "translate-x-6"
                : direction === "left"
                  ? "-translate-x-full"
                  : "translate-x-full",
            ),
      )}
      aria-hidden={!visible ? "true" : undefined}
      inert={!visible}
    >
      {children}
    </div>
  );
}
