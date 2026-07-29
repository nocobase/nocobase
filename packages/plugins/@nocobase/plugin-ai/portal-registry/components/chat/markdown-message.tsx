import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownMessageProps = {
  children: string;
  variant?: "chat" | "document";
};

function formatStandaloneJson(content: string) {
  const trimmed = content.trim();
  const isObject = trimmed.startsWith("{") && trimmed.endsWith("}");
  const isArray = trimmed.startsWith("[") && trimmed.endsWith("]");

  if (!isObject && !isArray) return null;

  try {
    const value: unknown = JSON.parse(trimmed);
    if (value === null || typeof value !== "object") return null;
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

function createMarkdownComponents(variant: MarkdownMessageProps["variant"]): Components {
  const document = variant === "document";

  return {
    h1: ({ className, ...props }) => (
      <h1
        {...props}
        className={cn(
          "mb-4 mt-7 scroll-m-20 font-bold tracking-tight first:mt-0",
          document ? "text-3xl" : "text-xl",
          className
        )}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        {...props}
        className={cn(
          "mb-3 mt-7 scroll-m-20 border-b pb-2 font-semibold tracking-tight first:mt-0",
          document ? "text-2xl" : "text-lg",
          className
        )}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        {...props}
        className={cn(
          "mb-2 mt-6 scroll-m-20 font-semibold tracking-tight first:mt-0",
          document ? "text-xl" : "text-base",
          className
        )}
      />
    ),
    h4: ({ className, ...props }) => (
      <h4
        {...props}
        className={cn(
          "mb-2 mt-5 scroll-m-20 font-semibold first:mt-0",
          document ? "text-lg" : "text-sm",
          className
        )}
      />
    ),
    p: ({ className, ...props }) => (
      <p {...props} className={cn("my-3 leading-7", className)} />
    ),
    ul: ({ className, ...props }) => (
      <ul
        {...props}
        className={cn("my-3 ml-6 list-disc space-y-1", className)}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        {...props}
        className={cn("my-3 ml-6 list-decimal space-y-1", className)}
      />
    ),
    li: ({ className, ...props }) => (
      <li {...props} className={cn("pl-1", className)} />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        {...props}
        className={cn(
          "my-4 border-l-4 border-border pl-4 italic text-muted-foreground",
          className
        )}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr {...props} className={cn("my-6 border-border", className)} />
    ),
    table: ({ className, ...props }) => (
      <div className="my-4 w-full overflow-x-auto rounded-md border">
        <table
          {...props}
          className={cn("w-full border-collapse text-sm", className)}
        />
      </div>
    ),
    th: ({ className, ...props }) => (
      <th
        {...props}
        className={cn(
          "border-b border-r bg-muted/60 px-3 py-2 text-left font-semibold last:border-r-0",
          className
        )}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        {...props}
        className={cn(
          "border-b border-r px-3 py-2 align-top last:border-r-0",
          className
        )}
      />
    ),
    tr: ({ className, ...props }) => (
      <tr
        {...props}
        className={cn("last:[&>td]:border-b-0", className)}
      />
    ),
    strong: ({ className, ...props }) => (
      <strong {...props} className={cn("font-semibold", className)} />
    ),
    a: ({ className, ...props }) => (
      <a
        {...props}
        className={cn("underline underline-offset-4", className)}
        target="_blank"
        rel="noreferrer"
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        {...props}
        className={cn(
          "my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm",
          className
        )}
      />
    ),
    code: ({ className, ...props }) => (
      <code
        {...props}
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]",
          className
        )}
      />
    ),
  };
}

const chatComponents = createMarkdownComponents("chat");
const documentComponents = createMarkdownComponents("document");

export function MarkdownMessage({
  children,
  variant = "chat",
}: MarkdownMessageProps) {
  const formattedJson = formatStandaloneJson(children);

  if (formattedJson) {
    return (
      <pre className="my-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">
        <code className="font-mono">{formattedJson}</code>
      </pre>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={variant === "document" ? documentComponents : chatComponents}
    >
      {children}
    </ReactMarkdown>
  );
}
