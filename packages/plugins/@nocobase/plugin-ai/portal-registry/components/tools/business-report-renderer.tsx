import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { getNocoBaseToolCallMetadata } from "../chat/tool-call-card";
import type { AIToolRendererProps } from "./tool-renderer-provider";
import {
  normalizeBusinessReportCharts,
  type BusinessReportData,
} from "./business-report-utils";
import {
  useBusinessReportDialog,
} from "./business-report-dialog";
import { asRecord, asString } from "./tool-renderer-utils";

function ReportGeneratingProgress() {
  return (
    <div
      role="progressbar"
      aria-label="Generating business report"
      className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted"
    >
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block size-full motion-reduce:hidden"
      >
        <rect x="-28" y="0" width="28" height="4" rx="2" className="fill-primary">
          <animate
            attributeName="x"
            values="-28;100"
            dur="1.35s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
      <div className="hidden h-full w-2/3 rounded-full bg-primary motion-reduce:block" />
    </div>
  );
}

export function BusinessReportRenderer({ part }: AIToolRendererProps) {
  const reportDialog = useBusinessReportDialog();
  const input = asRecord(part.input);
  const title = asString(input.title) || "Business analysis report";
  const reportSummary = asString(input.summary);
  const summary =
    reportSummary || "Open the report to review the generated analysis.";
  const charts = useMemo(
    () => normalizeBusinessReportCharts(input.charts),
    [input.charts]
  );
  const report = useMemo<BusinessReportData>(
    () => ({
      title,
      summary: reportSummary || undefined,
      markdown: asString(input.markdown),
      charts,
      fileName: asString(input.fileName) || undefined,
    }),
    [charts, input.fileName, input.markdown, reportSummary, title]
  );
  const metadata = getNocoBaseToolCallMetadata(part);
  const ready =
    part.state === "output-available" ||
    (metadata?.status === "success" &&
      ["done", "confirmed"].includes(metadata.invokeStatus ?? ""));
  const generating = !ready && part.state !== "output-error";
  const wasGenerating = useRef(false);

  useEffect(() => {
    reportDialog.update(part.toolCallId, report, ready);
  }, [part.toolCallId, ready, report, reportDialog]);

  useEffect(() => {
    if (generating) {
      wasGenerating.current = true;
      return;
    }
    if (wasGenerating.current && ready) {
      wasGenerating.current = false;
      reportDialog.open(part.toolCallId, report, ready);
    }
  }, [generating, part.toolCallId, ready, report, reportDialog]);

  return (
    <button
      type="button"
      className={cn(
        "w-full rounded-lg border bg-background p-3 text-left transition-colors",
        ready && "hover:bg-muted/40"
      )}
      disabled={!ready}
      onClick={() => reportDialog.open(part.toolCallId, report, ready)}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
          {generating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">{title}</div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {generating ? "Generating" : "Markdown"}
            </Badge>
            <Badge variant="outline">{charts.length} charts</Badge>
            <Badge variant="outline">Preview and export</Badge>
          </div>
          {generating ? <ReportGeneratingProgress /> : null}
        </div>
      </div>
    </button>
  );
}
