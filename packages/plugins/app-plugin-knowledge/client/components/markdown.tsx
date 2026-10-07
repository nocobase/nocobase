/**
 * A knowledge document's Markdown: GitHub-flavoured, `mermaid` code blocks drawn as diagrams, with each heading carrying the anchor a citation or a link ends
 * with (`markdownHeadings`, the same the server's chunks use), and its table of contents.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MermaidDiagram, mermaidSource } from '@nocobase/markdown-mermaid';
import { createElement, type ReactElement, type ReactNode } from 'react';
import Markdown, { type Components, type ExtraProps } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  markdownHeadings,
  type MarkdownHeading,
} from '../../shared/knowledge.js';

type HeadingProps = React.ComponentProps<'h1'> & ExtraProps;

type Lines = readonly [number, number] | null;

/** A block's first line, and the highlight when it lies in `lines`. */
function marked(
  node: ExtraProps['node'],
  lines: Lines,
): { 'data-line'?: number; 'data-highlighted'?: true; className?: string } {
  const start = node?.position?.start.line;
  const end = node?.position?.end.line ?? start;
  if (start === undefined) return {};
  const inside =
    lines !== null && end !== undefined && start <= lines[1] && end >= lines[0];
  return inside
    ? {
        'data-line': start,
        'data-highlighted': true,
        className:
          'rounded-sm bg-accent text-accent-foreground ring-4 ring-accent',
      }
    : { 'data-line': start };
}

function heading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  anchors: ReadonlyMap<number, string>,
  className: string,
  hiddenLine: number | null,
  lines: Lines,
) {
  return ({ node, children, ...props }: HeadingProps): ReactNode => {
    if (node?.position?.start.line === hiddenLine) return null;
    const mark = marked(node, lines);
    return createElement(
      `h${level}`,
      {
        ...props,
        ...mark,
        id: anchors.get(node?.position?.start.line ?? -1),
        className: cn('scroll-mt-20', className, mark.className),
      },
      children,
    );
  };
}

export function KnowledgeMarkdown({
  content,
  className,
  hiddenHeadingLine = null,
  highlight = null,
}: {
  readonly content: string;
  readonly className?: string;
  /** The line of a heading left out: a leading `# Title` the page already shows (`leadingTitleLine`). */
  readonly hiddenHeadingLine?: number | null;
  /** Lines whose blocks are highlighted (1-based, inclusive), such as a section's. */
  readonly highlight?: Lines;
}): ReactElement {
  const anchors = new Map(
    markdownHeadings(content).map((item) => [item.line, item.anchor]),
  );
  const components: Components = {
    h1: heading(
      1,
      anchors,
      'mt-6 mb-3 font-heading text-2xl font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    h2: heading(
      2,
      anchors,
      'mt-6 mb-2 border-b pb-1 font-heading text-xl font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    h3: heading(
      3,
      anchors,
      'mt-5 mb-2 text-lg font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    h4: heading(
      4,
      anchors,
      'mt-4 mb-2 font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    h5: heading(
      5,
      anchors,
      'mt-4 mb-2 font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    h6: heading(
      6,
      anchors,
      'mt-4 mb-2 font-semibold first:mt-0',
      hiddenHeadingLine,
      highlight,
    ),
    p: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      return (
        <p
          {...props}
          {...mark}
          className={cn('leading-7 not-first:mt-3', mark.className)}
        />
      );
    },
    a: ({ node: _node, ...props }) => (
      <a
        className='font-medium text-primary underline underline-offset-4'
        {...props}
      />
    ),
    ul: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      return (
        <ul
          {...props}
          {...mark}
          className={cn('my-3 ml-6 list-disc space-y-1', mark.className)}
        />
      );
    },
    ol: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      return (
        <ol
          {...props}
          {...mark}
          className={cn('my-3 ml-6 list-decimal space-y-1', mark.className)}
        />
      );
    },
    blockquote: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      return (
        <blockquote
          {...props}
          {...mark}
          className={cn(
            'my-3 border-l-2 pl-4 text-muted-foreground italic',
            mark.className,
          )}
        />
      );
    },
    code: ({ node: _node, className: name, ...props }) => (
      <code
        className={cn(
          'rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]',
          name,
        )}
        {...props}
      />
    ),
    pre: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      const block = (
        <pre
          {...props}
          {...mark}
          className={cn(
            'my-3 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-sm [&>code]:bg-transparent [&>code]:p-0',
            mark.className,
          )}
        />
      );
      const source = mermaidSource(node);
      return source === undefined ? (
        block
      ) : (
        <MermaidDiagram
          source={source}
          fallback={block}
          className='my-3 overflow-x-auto [&_svg]:mx-auto'
        />
      );
    },
    table: ({ node, ...props }) => {
      const mark = marked(node, highlight);
      return (
        <div
          {...mark}
          className={cn('my-3 w-full overflow-x-auto', mark.className)}
        >
          <table className='w-full text-sm' {...props} />
        </div>
      );
    },
    th: ({ node: _node, ...props }) => (
      <th className='border px-2 py-1 text-left font-medium' {...props} />
    ),
    td: ({ node: _node, ...props }) => (
      <td className='border px-2 py-1 align-top' {...props} />
    ),
  };
  return (
    <div
      className={cn(
        'min-w-0 text-sm wrap-break-word text-foreground',
        className,
      )}
      data-testid='knowledge-markdown'
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}

export function TableOfContents({
  headings,
}: {
  readonly headings: readonly MarkdownHeading[];
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (headings.length === 0) return null;
  const top = Math.min(...headings.map((item) => item.level));
  return (
    <nav aria-label={t('knowledge.doc.contents')} className='space-y-1 text-sm'>
      <p className='font-medium text-muted-foreground'>
        {t('knowledge.doc.contents')}
      </p>
      <ul className='space-y-1'>
        {headings.map((item) => (
          <li
            key={item.anchor}
            style={{ paddingLeft: `${(item.level - top) * 12}px` }}
          >
            <a
              href={`#${item.anchor}`}
              className='block truncate text-muted-foreground hover:text-foreground'
              onClick={(event) => {
                event.preventDefault();
                document
                  .getElementById(item.anchor)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
