import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MousePointer2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AIWorkContextItem } from "../../providers";

const formatContextContent = (content: unknown) => {
  if (content === undefined) return "No context payload";
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
};

export function WorkContextChip({
  item,
  onRemove,
  className,
}: {
  item: AIWorkContextItem;
  onRemove?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const title = item.title ?? "Page element";
  const kind = typeof item.kind === "string" ? item.kind : undefined;
  const content = useMemo(
    () => formatContextContent(item.content),
    [item.content]
  );

  return (
    <>
      <span
        className={cn(
          "flex min-w-0 max-w-full items-center rounded-md border bg-muted/40 text-xs text-muted-foreground",
          className
        )}
      >
        <button
          type="button"
          className="flex min-w-0 items-center gap-1.5 rounded-l-md px-2 py-1 text-left hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View context: ${title}`}
          onClick={() => setOpen(true)}
        >
          <MousePointer2 className="size-3.5 shrink-0" />
          <span className="truncate">{title}</span>
        </button>
        {onRemove ? (
          <button
            type="button"
            className="mr-1 rounded-sm p-0.5 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remove ${title}`}
            onClick={onRemove}
          >
            <X className="size-3" />
          </button>
        ) : null}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pr-8">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              This is the page context included with the message sent to the AI
              employee.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border bg-muted/40 px-2 py-1">
              Type: {item.type}
            </span>
            {kind ? (
              <span className="rounded-md border bg-muted/40 px-2 py-1">
                Kind: {kind}
              </span>
            ) : null}
            {item.id ? (
              <span className="max-w-full truncate rounded-md border bg-muted/40 px-2 py-1">
                ID: {item.id}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Context payload
            </div>
            <pre className="max-h-[55vh] overflow-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5 whitespace-pre-wrap break-words">
              {content}
            </pre>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
