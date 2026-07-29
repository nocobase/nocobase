import { MarkdownMessage } from "../chat/markdown-message";
import { LoadingState } from "@/components/app-shell/loading-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileCode2, LoaderCircle, Printer } from "lucide-react";
import {
  createContext,
  lazy,
  type PropsWithChildren,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildBusinessReportHtml,
  buildBusinessReportMarkdown,
  downloadBusinessReportFile,
  getBusinessReportFileName,
  printBusinessReport,
  splitBusinessReportMarkdown,
  type BusinessReportData,
} from "./business-report-utils";

type BusinessReportDialogSnapshot = {
  open: boolean;
  toolCallId?: string;
  report?: BusinessReportData;
  ready: boolean;
};

const closedSnapshot: BusinessReportDialogSnapshot = {
  open: false,
  ready: false,
};
const EChartsPreview = lazy(() => import("./echarts-preview"));

const sameCharts = (
  left: BusinessReportData["charts"],
  right: BusinessReportData["charts"]
) => left === right || JSON.stringify(left) === JSON.stringify(right);

const sameReport = (
  left: BusinessReportData | undefined,
  right: BusinessReportData
) =>
  left?.title === right.title &&
  left.summary === right.summary &&
  left.markdown === right.markdown &&
  left.fileName === right.fileName &&
  sameCharts(left.charts, right.charts);

type BusinessReportDialogController = {
  open: (
    toolCallId: string,
    report: BusinessReportData,
    ready: boolean
  ) => void;
  update: (
    toolCallId: string,
    report: BusinessReportData,
    ready: boolean
  ) => void;
};

const BusinessReportDialogContext =
  createContext<BusinessReportDialogController | null>(null);

export function useBusinessReportDialog() {
  const value = useContext(BusinessReportDialogContext);
  if (!value) {
    throw new Error(
      "useBusinessReportDialog must be used inside BusinessReportDialogProvider"
    );
  }
  return value;
}

export function BusinessReportDialogProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(closedSnapshot);
  const open = useCallback(
    (toolCallId: string, report: BusinessReportData, ready: boolean) =>
      setState({ open: true, toolCallId, report, ready }),
    []
  );
  const update = useCallback(
    (toolCallId: string, report: BusinessReportData, ready: boolean) =>
      setState((current) => {
        if (current.toolCallId !== toolCallId) return current;
        if (current.ready === ready && sameReport(current.report, report)) {
          return current;
        }
        return { ...current, report, ready };
      }),
    []
  );
  const controller = useMemo(() => ({ open, update }), [open, update]);
  return (
    <BusinessReportDialogContext.Provider value={controller}>
      {children}
      <BusinessReportDialogHost
        state={state}
        onOpenChange={(nextOpen) =>
          setState((current) =>
            current.open === nextOpen ? current : { ...current, open: nextOpen }
          )
        }
      />
    </BusinessReportDialogContext.Provider>
  );
}

function ChartPreview({ options }: { options: Record<string, unknown> }) {
  return (
    <Suspense fallback={<LoadingState className="h-[280px]" />}>
      <EChartsPreview options={options} />
    </Suspense>
  );
}

function BusinessReportDialogHost({
  state,
  onOpenChange,
}: {
  state: BusinessReportDialogSnapshot;
  onOpenChange: (open: boolean) => void;
}) {
  const report = state.report;
  const [activeTab, setActiveTab] = useState("preview");
  const [htmlPreview, setHtmlPreview] = useState("");
  const [htmlPreviewSignature, setHtmlPreviewSignature] = useState("");
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [exporting, setExporting] = useState<"html" | "pdf">();
  const [exportError, setExportError] = useState<string>();
  const reportSignature = useMemo(
    () => (state.ready && report ? JSON.stringify(report) : ""),
    [report, state.ready]
  );
  const reportMarkdown = useMemo(
    () =>
      state.open && state.ready && report
        ? buildBusinessReportMarkdown(report)
        : "",
    [report, state.open, state.ready]
  );
  const previewParts = useMemo(
    () =>
      activeTab === "preview" && reportMarkdown
        ? splitBusinessReportMarkdown(reportMarkdown)
        : [],
    [activeTab, reportMarkdown]
  );

  useEffect(() => {
    setActiveTab("preview");
    setHtmlPreview("");
    setHtmlPreviewSignature("");
    setExportError(undefined);
  }, [state.toolCallId]);

  useEffect(() => {
    if (
      !state.open ||
      activeTab !== "html" ||
      !state.ready ||
      !report?.markdown ||
      (htmlPreview && htmlPreviewSignature === reportSignature)
    ) {
      return;
    }
    let active = true;
    setHtmlLoading(true);
    setHtmlPreview("");
    void buildBusinessReportHtml(report)
      .then((html) => {
        if (!active) return;
        setHtmlPreview(html);
        setHtmlPreviewSignature(reportSignature);
      })
      .catch((error: unknown) => {
        if (active) {
          setExportError(
            error instanceof Error ? error.message : "Unable to build HTML"
          );
        }
      })
      .finally(() => {
        if (active) setHtmlLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    activeTab,
    htmlPreview,
    htmlPreviewSignature,
    report,
    reportSignature,
    state.open,
    state.ready,
  ]);

  if (!report) return null;
  const summary =
    report.summary || "Open the report to review the generated analysis.";
  const fileName = getBusinessReportFileName(report);

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[86svh] w-[min(980px,calc(100vw-2rem))] max-w-[980px] grid-rows-[auto_1fr_auto] overflow-hidden p-0 sm:max-w-[980px]">
        <div className="border-b px-5 py-4">
          <DialogTitle>{report.title}</DialogTitle>
          <DialogDescription className="mt-1">{summary}</DialogDescription>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(String(value))}
          className="min-h-0 overflow-hidden px-5 py-4"
        >
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>
          <TabsContent
            value="preview"
            className="mt-3 min-h-0 overflow-auto rounded-lg border bg-background p-5"
          >
            <div className="space-y-4">
              {previewParts.map((item, index) =>
                item.type === "markdown" ? (
                  <div key={index} className="ai-markdown">
                    <MarkdownMessage variant="document">
                      {item.content}
                    </MarkdownMessage>
                  </div>
                ) : (
                  <div key={index} className="rounded-lg border p-3">
                    <ChartPreview options={item.options} />
                  </div>
                )
              )}
            </div>
          </TabsContent>
          <TabsContent
            value="markdown"
            className="mt-3 min-h-0 overflow-auto rounded-lg bg-muted p-4"
          >
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5">
              {reportMarkdown}
            </pre>
          </TabsContent>
          <TabsContent
            value="html"
            className="mt-3 min-h-0 overflow-hidden rounded-lg border bg-background"
          >
            {htmlPreview ? (
              <iframe
                title={`${report.title} HTML preview`}
                srcDoc={htmlPreview}
                className="size-full min-h-[480px] border-0 bg-white"
              />
            ) : htmlLoading ? (
              <LoadingState className="h-full min-h-[480px]" />
            ) : (
              <div className="flex h-full min-h-[480px] items-center justify-center gap-2 text-sm text-muted-foreground">
                HTML is unavailable
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
          {exportError ? (
            <p className="mr-auto text-xs text-destructive">{exportError}</p>
          ) : null}
          <Button
            variant="outline"
            disabled={!report.markdown}
            onClick={() =>
              downloadBusinessReportFile(
                `${fileName}.md`,
                reportMarkdown,
                "text/markdown;charset=utf-8"
              )
            }
          >
            <Download /> Download Markdown
          </Button>
          <Button
            variant="outline"
            disabled={!report.markdown || exporting !== undefined}
            onClick={async () => {
              setExportError(undefined);
              setExporting("html");
              try {
                const html = await buildBusinessReportHtml(report, {
                  printMode: true,
                });
                downloadBusinessReportFile(
                  `${fileName}.html`,
                  html,
                  "text/html;charset=utf-8"
                );
              } catch (error) {
                setExportError(
                  error instanceof Error
                    ? error.message
                    : "Unable to export HTML"
                );
              } finally {
                setExporting(undefined);
              }
            }}
          >
            {exporting === "html" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <FileCode2 />
            )}
            Download HTML
          </Button>
          <Button
            disabled={!report.markdown || exporting !== undefined}
            onClick={async () => {
              setExportError(undefined);
              setExporting("pdf");
              try {
                const opened = await printBusinessReport(report);
                if (!opened) {
                  setExportError(
                    "Popup blocked. Allow popups and try printing again."
                  );
                }
              } catch (error) {
                setExportError(
                  error instanceof Error
                    ? error.message
                    : "Unable to print report"
                );
              } finally {
                setExporting(undefined);
              }
            }}
          >
            {exporting === "pdf" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Printer />
            )}
            Print PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
