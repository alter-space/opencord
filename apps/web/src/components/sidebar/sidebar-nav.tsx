import type { ReactNode } from "react";

export function SidebarNav({
  rail,
  panel,
}: {
  rail: ReactNode;
  panel: ReactNode;
}) {
  return (
    <aside className="grid h-full w-[22rem] grid-cols-[4.5rem_minmax(0,1fr)]">
      <nav className="border-r border-border/60 bg-background/90">
        {rail}
      </nav>
      <div className="flex min-w-0 flex-col border-r border-border/60 bg-card/40">
        {panel}
      </div>
    </aside>
  );
}
