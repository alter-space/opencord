import type * as React from "react";

import { cn } from "@/lib/utils";

function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive min-h-24 w-full rounded-[1.25rem] border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-1 placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { TextArea };
