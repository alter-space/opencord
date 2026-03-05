import { cn } from "@/lib/utils";
import type { PropsWithChildren, ReactNode } from "react";

export function SidebarNav({
  currentArea,
  rail,
  panel,
}: {
  currentArea: string | null;
  rail: ReactNode;
  panel: ReactNode;
}) {
  return (
    <div
      className={cn(
        "h-full overflow-hidden transition-[width] duration-300",
        currentArea !== null ? "w-70" : "w-14",
      )}
    >
      <nav className="grid size-full grid-cols-[3.5rem_1fr]">
        {rail}
        <div
          className={cn(
            "size-full overflow-hidden py-1.5 pr-1.5 transition-opacity duration-300",
            currentArea === null && "opacity-0",
          )}
        >
          <div className="relative flex h-full min-w-52 flex-col overflow-y-auto overflow-x-hidden rounded-lg bg-card">
            <div className="relative flex grow flex-col p-2">
              <div className="relative w-full grow">
                {panel}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export function SidebarArea({
  visible,
  direction,
  children,
}: PropsWithChildren<{
  visible: boolean;
  direction: "left" | "right";
}>) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-y-auto transition-[opacity,translate] duration-300",
        visible
          ? "translate-x-0"
          : cn(
              "opacity-0 pointer-events-none",
              direction === "left" ? "-translate-x-full" : "translate-x-full",
            ),
      )}
      aria-hidden={!visible ? "true" : undefined}
      inert={!visible}
    >
      {children}
    </div>
  );
}
