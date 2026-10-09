/**
 * Markdown as compact prose for descriptions and comments: GitHub-flavoured Markdown, mention links
 * (`[@Name](mention://<kind>/<id>)`, as `RichTextEditor` writes them) shown as chips, and fenced code a consumer may
 * draw itself (`renderCodeBlock`, for diagrams). Every other URL keeps react-markdown's sanitisation.
 */
import { UserIcon } from 'lucide-react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import Markdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from 'cn';

import { remarkCjkAutolink } from './remark-cjk-autolink.js';

const MENTION_HREF = /^mention:\/\/([a-z][a-z0-9_]{1,31})\//u;

function urlTransform(url: string): string {
  return MENTION_HREF.test(url) ? url : defaultUrlTransform(url);
}

interface HastNode {
  readonly type?: string;
  readonly tagName?: string;
  readonly value?: string;
  readonly properties?: { readonly className?: unknown };
  readonly children?: readonly HastNode[];
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(textOf).join('');
}

/** A fenced block's language and source, from the `pre` element react-markdown renders it as. */
function codeOf(
  node: HastNode | undefined,
): { readonly language: string | null; readonly source: string } | null {
  const code = node?.children?.find((child) => child.tagName === 'code');
  if (!code) return null;
  const classes = code.properties?.className;
  const language = Array.isArray(classes)
    ? ((classes as unknown[])
        .map(String)
        .find((name) => name.startsWith('language-'))
        ?.slice('language-'.length) ?? null)
    : null;
  return { language, source: textOf(code).replace(/\n$/u, '') };
}

export interface MarkdownViewProps {
  readonly content: string;
  readonly className?: string;
  /** Ids for the rendered `h1`/`h2`/`h3`, in document order, so a page can scroll to them. */
  readonly headingIds?: readonly string[];
  /** Draws a fenced code block itself (a `mermaid` diagram, say); `block` is the plain rendering. */
  readonly renderCodeBlock?: (
    code: { readonly language: string | null; readonly source: string },
    block: ReactElement,
  ) => ReactNode;
  /** The icon of a mention chip by its kind; a person by default. */
  readonly mentionIcon?: (kind: string) => ReactNode;
}

export function MarkdownView({
  content,
  className,
  headingIds,
  renderCodeBlock,
  mentionIcon,
}: MarkdownViewProps): ReactElement {
  let heading = 0;
  const nextId = (): string | undefined => headingIds?.[heading++];
  const components: Components = {
    a: ({
      href,
      children,
      node: _node,
      ...props
    }: ComponentProps<'a'> & { readonly node?: unknown }) => {
      const mention = href ? MENTION_HREF.exec(href) : null;
      if (mention)
        return (
          <span
            data-mention={mention[1]}
            className='inline-flex items-center gap-0.5 rounded-md bg-secondary px-1 py-px align-baseline font-medium text-secondary-foreground [&_svg]:size-3'
          >
            {mentionIcon?.(mention[1] ?? '') ?? <UserIcon aria-hidden='true' />}
            {children}
          </span>
        );
      return (
        <a
          href={href}
          target='_blank'
          rel='noreferrer'
          className='font-medium text-primary underline underline-offset-4'
          {...props}
        >
          {children}
        </a>
      );
    },
    p: ({ node: _node, ...props }) => (
      <p className='leading-6 not-first:mt-2' {...props} />
    ),
    ul: ({ node: _node, ...props }) => (
      <ul className='my-2 ml-5 list-disc space-y-1' {...props} />
    ),
    ol: ({ node: _node, ...props }) => (
      <ol className='my-2 ml-5 list-decimal space-y-1' {...props} />
    ),
    blockquote: ({ node: _node, ...props }) => (
      <blockquote
        className='my-2 border-l-2 pl-3 text-muted-foreground'
        {...props}
      />
    ),
    code: ({ node: _node, className: codeClass, ...props }) => (
      <code
        className={cn(
          'rounded bg-muted px-1 py-0.5 font-mono text-xs',
          codeClass,
        )}
        {...props}
      />
    ),
    pre: ({ node, ...props }) => {
      const block = (
        <pre
          className='my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs [&>code]:bg-transparent [&>code]:p-0'
          {...props}
        />
      );
      const code = renderCodeBlock ? codeOf(node) : null;
      return code && renderCodeBlock ? (
        <>{renderCodeBlock(code, block)}</>
      ) : (
        block
      );
    },
    table: ({ node: _node, ...props }) => (
      <div className='my-2 w-full overflow-x-auto'>
        <table className='w-full text-sm' {...props} />
      </div>
    ),
    th: ({ node: _node, ...props }) => (
      <th className='border px-2 py-1 text-left font-medium' {...props} />
    ),
    td: ({ node: _node, ...props }) => (
      <td className='border px-2 py-1' {...props} />
    ),
    hr: ({ node: _node, ...props }) => <hr className='my-3' {...props} />,
    h1: ({ node: _node, ...props }) => (
      <h1
        id={nextId()}
        className='mt-4 mb-2 text-lg font-semibold first:mt-0'
        {...props}
      />
    ),
    h2: ({ node: _node, ...props }) => (
      <h2
        id={nextId()}
        className='mt-4 mb-2 text-base font-semibold first:mt-0'
        {...props}
      />
    ),
    h3: ({ node: _node, ...props }) => (
      <h3
        id={nextId()}
        className='mt-3 mb-1.5 text-sm font-semibold first:mt-0'
        {...props}
      />
    ),
  };
  return (
    <div
      className={cn('min-w-0 text-sm wrap-anywhere', className)}
      data-slot='markdown-view'
    >
      <Markdown
        remarkPlugins={[remarkGfm, remarkCjkAutolink]}
        urlTransform={urlTransform}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
