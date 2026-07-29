import { Suspense, type ReactNode } from "react";

import { LoadingState } from "@/components/app-shell/loading-state";

export function LazyRouteSurfaceDemo({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState className="min-h-80" />}>
      {children}
    </Suspense>
  );
}
