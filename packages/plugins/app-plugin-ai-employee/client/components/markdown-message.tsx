import type { ReactElement } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from 'cn';

interface MarkdownMessageProps {
  readonly children: string;
}

function formatStandaloneJson(content: string): string | null {
  const trimmed = content.trim();
  const isObject = trimmed.startsWith('{') && trimmed.endsWith('}');
  const isArray = trimmed.startsWith('[') && trimmed.endsWith(']');
  if (!isObject && !isArray) return null;

  try {
    const value: unknown = JSON.parse(trimmed);
    if (value === null || typeof value !== 'object') return null;
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

const documentComponents: Components = {
  h1: ({ node: _node, className, ...props }) => (
    <h1
      {...props}
      className={cn(
        'mb-4 mt-7 scroll-m-20 font-heading text-3xl font-bold tracking-tight first:mt-0',
        className,
      )}
    />
  ),
  h2: ({ node: _node, className, ...props }) => (
    <h2
      {...props}
      className={cn(
        'mb-3 mt-7 scroll-m-20 border-b pb-2 font-heading text-2xl font-semibold tracking-tight first:mt-0',
        className,
      )}
    />
  ),
  h3: ({ node: _node, className, ...props }) => (
    <h3
      {...props}
      className={cn(
        'mb-2 mt-6 scroll-m-20 font-heading text-xl font-semibold tracking-tight first:mt-0',
        className,
      )}
    />
  ),
  h4: ({ node: _node, className, ...props }) => (
    <h4
      {...props}
      className={cn(
        'mb-2 mt-5 scroll-m-20 font-heading text-lg font-semibold first:mt-0',
        className,
      )}
    />
  ),
  p: ({ node: _node, className, ...props }) => (
    <p {...props} className={cn('my-3 leading-7', className)} />
  ),
  ul: ({ node: _node, className, ...props }) => (
    <ul {...props} className={cn('my-3 ml-6 list-disc space-y-1', className)} />
  ),
  ol: ({ node: _node, className, ...props }) => (
    <ol
      {...props}
      className={cn('my-3 ml-6 list-decimal space-y-1', className)}
    />
  ),
  li: ({ node: _node, className, ...props }) => (
    <li {...props} className={cn('pl-1', className)} />
  ),
  blockquote: ({ node: _node, className, ...props }) => (
    <blockquote
      {...props}
      className={cn(
        'my-4 border-l-4 border-border pl-4 italic text-muted-foreground',
        className,
      )}
    />
  ),
  hr: ({ node: _node, className, ...props }) => (
    <hr {...props} className={cn('my-6 border-border', className)} />
  ),
  table: ({ node: _node, className, ...props }) => (
    <div className='my-4 w-full overflow-x-auto rounded-md border'>
      <table
        {...props}
        className={cn('w-full border-collapse text-sm', className)}
      />
    </div>
  ),
  th: ({ node: _node, className, ...props }) => (
    <th
      {...props}
      className={cn(
        'border-b border-r bg-muted/60 px-3 py-2 text-left font-semibold last:border-r-0',
        className,
      )}
    />
  ),
  td: ({ node: _node, className, ...props }) => (
    <td
      {...props}
      className={cn(
        'border-b border-r px-3 py-2 align-top last:border-r-0',
        className,
      )}
    />
  ),
  tr: ({ node: _node, className, ...props }) => (
    <tr {...props} className={cn('last:[&>td]:border-b-0', className)} />
  ),
  strong: ({ node: _node, className, ...props }) => (
    <strong {...props} className={cn('font-semibold', className)} />
  ),
  a: ({ node: _node, className, ...props }) => (
    <a
      {...props}
      className={cn('underline underline-offset-4', className)}
      target='_blank'
      rel='noopener noreferrer'
    />
  ),
  pre: ({ node: _node, className, ...props }) => (
    <pre
      {...props}
      tabIndex={0}
      className={cn(
        'my-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    />
  ),
  code: ({ node: _node, className, ...props }) => (
    <code
      {...props}
      className={cn(
        'rounded bg-muted px-1.5 py-0.5 font-mono text-sm',
        className,
      )}
    />
  ),
};

/** Read-only catalog documents; raw HTML and unsafe URLs are never enabled. */
export function MarkdownMessage({
  children,
}: MarkdownMessageProps): ReactElement {
  const formattedJson = formatStandaloneJson(children);
  if (formattedJson) {
    return (
      <pre
        tabIndex={0}
        className='my-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      >
        <code className='font-mono'>{formattedJson}</code>
      </pre>
    );
  }

  return (
    <ReactMarkdown
      skipHtml
      remarkPlugins={[remarkGfm]}
      components={documentComponents}
    >
      {children}
    </ReactMarkdown>
  );
}
