import { MermaidDiagram, mermaidSource } from '@nocobase/markdown-mermaid';
import type { ComponentProps, ReactElement } from 'react';
import Markdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { MENTION_KIND_PATTERN } from '../lib/mentions.js';
import { remarkCjkAutolink } from '../lib/remark-cjk-autolink.js';
import { cn } from 'cn';

import type { TocHeading } from './pm-markdown-toc.js';
import { PmKindIcon } from './pm-kind-icon.js';

export interface PmMarkdownProps {
  readonly content: string;
  readonly className?: string;
  /**
   * `extractMarkdownHeadings(content)` (`np-markdown-toc.ts`), to give the rendered `h1`/`h2`/`h3` elements matching
   * `id`s so a page can scroll to them. Ids are consumed in document order, one per heading
   * rendered; omit to render headings without ids (the default, for comments and descriptions).
   */
  readonly headings?: readonly TocHeading[];
}

// `mention://<kind>/<id>` URLs are mention links (`lib/mentions.ts`). react-markdown's default
// transform drops unknown schemes, so mentions are let through here and rendered as chips; every other URL keeps the
// default sanitisation.
const MENTION_HREF = new RegExp(`^mention://(${MENTION_KIND_PATTERN})/`, 'u');

function urlTransform(url: string): string {
  return MENTION_HREF.test(url) ? url : defaultUrlTransform(url);
}

function MentionOrLink({
  href,
  children,
  node: _node,
  ...props
}: ComponentProps<'a'> & { readonly node?: unknown }): ReactElement {
  const mention = href ? MENTION_HREF.exec(href) : null;
  if (mention) {
    return (
      <span
        data-mention={mention[1]}
        className='inline-flex items-center gap-0.5 rounded-md bg-secondary px-1 py-px align-baseline font-medium text-secondary-foreground'
      >
        <PmKindIcon
          kind={mention[1] ?? ''}
          className='size-3'
          aria-hidden='true'
        />
        {children}
      </span>
    );
  }
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
}

// Compact prose for comments and descriptions: the Typography primitives are sized for long-form pages, which would
// make every comment look like an article. Only tokens and the Tailwind scale are used.
const baseComponents: Components = {
  a: MentionOrLink,
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
  code: ({ node: _node, className, ...props }) => (
    <code
      className={cn(
        'rounded bg-muted px-1 py-0.5 font-mono text-xs',
        className,
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
    const source = mermaidSource(node);
    return source === undefined ? (
      block
    ) : (
      <MermaidDiagram
        source={source}
        fallback={block}
        className='my-2 overflow-x-auto [&_svg]:mx-auto'
      />
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
};

/**
 * `h1`/`h2`/`h3` renderers that hand out `headings[]`'s ids in document order, one per heading rendered. Built fresh
 * on every `PmMarkdown` render (not memoized) so the counter starts over each time; react-markdown re-invokes every
 * component on every render regardless, so memoizing this object would only leave the counter stuck past the end
 * of `headings` after the first render.
 */
function headingComponents(
  headings?: readonly TocHeading[],
): Pick<Components, 'h1' | 'h2' | 'h3'> {
  let index = 0;
  const nextId = (): string | undefined => headings?.[index++]?.id;
  return {
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
}

/** Markdown for issue descriptions and comments, with mentions shown as chips and `mermaid` code blocks as diagrams. */
export function PmMarkdown({
  content,
  className,
  headings,
}: PmMarkdownProps): ReactElement {
  const components = { ...baseComponents, ...headingComponents(headings) };
  return (
    <div className={cn('min-w-0 text-sm wrap-anywhere', className)}>
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
