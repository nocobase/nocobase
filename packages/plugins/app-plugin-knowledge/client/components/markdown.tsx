/**
 * A knowledge document's Markdown on the shared `MarkdownView`, with what documents add to it: each heading carries
 * the anchor a citation or a link ends with (`markdownHeadings`, the same the server's chunks use), a leading title the
 * page already shows can be left out, a range of source lines can be highlighted, `mermaid` code blocks are drawn as
 * diagrams, and the longer document spacing. Also the document's table of contents.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MermaidDiagram } from '@nocobase/markdown-mermaid';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { Components, ExtraProps } from 'react-markdown';

import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  markdownHeadings,
  type MarkdownHeading,
} from '../../shared/knowledge.js';
import {
  MarkdownView,
  markdownViewComponents as base,
  type MarkdownCodeBlock,
  type MarkdownRemarkPlugins,
  type MarkdownViewComponents,
} from './markdown-view.js';

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

const HighlightContext = createContext<Lines>(null);

type BlockTag = keyof MarkdownViewComponents &
  (
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'p'
    | 'ul'
    | 'ol'
    | 'blockquote'
    | 'pre'
    | 'table'
  );

/** The base element with the document's spacing, marking its first source line and the highlight. */
function block<Tag extends BlockTag>(
  tag: Tag,
  className: string,
): (props: ComponentProps<Tag> & ExtraProps) => ReactNode {
  const Base = base[tag] as (
    props: ComponentProps<'div'> & ExtraProps,
  ) => ReactNode;
  return function KnowledgeBlock(props) {
    const mark = marked(props.node, useContext(HighlightContext));
    return (
      <Base
        {...(props as ComponentProps<'div'> & ExtraProps)}
        {...mark}
        className={cn(className, props.className, mark.className)}
      />
    );
  };
}

const components: Components = {
  h1: block('h1', 'mt-6 mb-3 scroll-mt-20 font-heading text-2xl font-semibold'),
  h2: block(
    'h2',
    'mt-6 mb-2 scroll-mt-20 border-b pb-1 font-heading text-xl font-semibold',
  ),
  h3: block('h3', 'mt-5 mb-2 scroll-mt-20 text-lg font-semibold'),
  h4: block('h4', 'mt-4 mb-2 scroll-mt-20 text-sm font-semibold'),
  h5: block(
    'h5',
    'mt-4 mb-2 scroll-mt-20 text-sm font-semibold text-foreground',
  ),
  h6: block(
    'h6',
    'mt-4 mb-2 scroll-mt-20 text-sm font-semibold text-foreground',
  ),
  p: block('p', 'leading-7 not-first:mt-3'),
  ul: block('ul', 'my-3 ml-6'),
  ol: block('ol', 'my-3 ml-6'),
  blockquote: block('blockquote', 'my-3 pl-4 italic'),
  pre: block('pre', 'my-3 text-sm'),
  table: block('table', 'my-3'),
  code: ({ className, ...props }: ComponentProps<'code'> & ExtraProps) => (
    <base.code {...props} className={cn('text-[0.85em]', className)} />
  ),
};

function renderCodeBlock(
  code: MarkdownCodeBlock,
  fallback: ReactElement,
): ReactNode {
  return code.language === 'mermaid' ? (
    <MermaidDiagram
      source={code.source}
      fallback={fallback}
      className='my-3 overflow-x-auto [&_svg]:mx-auto'
    />
  ) : (
    fallback
  );
}

interface MdastNode {
  type: string;
  position?: { start: { line: number } };
  children?: MdastNode[];
  data?: { hProperties?: Record<string, unknown> };
}

/**
 * Gives each heading its anchor by source line, as `markdownHeadings` found them, and leaves out the heading on
 * `hiddenLine`.
 */
function remarkKnowledgeHeadings(options: {
  readonly anchors: ReadonlyMap<number, string>;
  readonly hiddenLine: number | null;
}) {
  return (tree: MdastNode): void => {
    const visit = (node: MdastNode): void => {
      if (!node.children) return;
      node.children = node.children.filter(
        (child) =>
          !(
            child.type === 'heading' &&
            child.position?.start.line === options.hiddenLine
          ),
      );
      for (const child of node.children) {
        const line = child.position?.start.line;
        const anchor =
          child.type === 'heading' && line !== undefined
            ? options.anchors.get(line)
            : undefined;
        if (anchor !== undefined) {
          child.data ??= {};
          child.data.hProperties = { ...child.data.hProperties, id: anchor };
        }
        visit(child);
      }
    };
    visit(tree);
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
  const remarkPlugins = useMemo<MarkdownRemarkPlugins>(
    () => [
      [
        remarkKnowledgeHeadings,
        {
          anchors: new Map(
            markdownHeadings(content).map((item) => [item.line, item.anchor]),
          ),
          hiddenLine: hiddenHeadingLine,
        },
      ],
    ],
    [content, hiddenHeadingLine],
  );
  return (
    <HighlightContext value={highlight}>
      <div
        data-testid='knowledge-markdown'
        className={cn('min-w-0', className)}
      >
        <MarkdownView
          content={content}
          className='text-foreground'
          components={components}
          remarkPlugins={remarkPlugins}
          renderCodeBlock={renderCodeBlock}
        />
      </div>
    </HighlightContext>
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
