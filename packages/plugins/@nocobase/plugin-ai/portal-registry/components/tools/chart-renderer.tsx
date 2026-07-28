import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/app-shell/loading-state";
import { CheckCircle2, Copy, LoaderCircle } from "lucide-react";
import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import type { AIToolRendererProps } from "./tool-renderer-provider";
import { asRecord } from "./tool-renderer-utils";

const EChartsPreview = lazy(() => import("./echarts-preview"));

class ChartErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback: (error: Error) => ReactNode;
    resetKey: unknown;
  },
  { error: Error | null; resetKey: unknown }
> {
  state = { error: null, resetKey: this.props.resetKey } as {
    error: Error | null;
    resetKey: unknown;
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey: unknown },
    state: { error: Error | null; resetKey: unknown }
  ) {
    return props.resetKey !== state.resetKey
      ? { error: null, resetKey: props.resetKey }
      : null;
  }

  render() {
    return this.state.error
      ? this.props.fallback(this.state.error)
      : this.props.children;
  }
}

function ChartError({ error }: { error: Error }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
      <div className="font-medium">Invalid chart options</div>
      <div className="mt-1 flex items-start justify-between gap-3">
        <span className="break-all leading-5">{error.message}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Copy chart error"
          onClick={async () => {
            await navigator.clipboard.writeText(error.message);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <CheckCircle2 /> : <Copy />}
        </Button>
      </div>
    </div>
  );
}

export function ChartPreview({
  options,
}: {
  options: Record<string, unknown>;
}) {
  return (
    <Suspense fallback={<LoadingState className="h-[280px]" />}>
      <EChartsPreview options={options} />
    </Suspense>
  );
}

export function ChartRenderer({ part }: AIToolRendererProps) {
  const input = asRecord(part.input);
  const options = asRecord(input.options);
  if (!Object.keys(options).length) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" /> Generating chart…
      </div>
    );
  }
  return (
    <ChartErrorBoundary
      resetKey={part.input}
      fallback={(error) => <ChartError error={error} />}
    >
      <div className="rounded-lg border bg-background p-3">
        <ChartPreview options={options} />
      </div>
    </ChartErrorBoundary>
  );
}
