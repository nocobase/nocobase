import { MermaidDiagram, mermaidSource } from '@nocobase/markdown-mermaid';
import type { ReactElement } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from 'cn';

// Compact prose for transcript text: only tokens and the Tailwind scale.
const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a
      target='_blank'
      rel='noreferrer'
      className='font-medium text-primary underline underline-offset-4'
      {...props}
    />
  ),
  p: ({ node: _node, ...props }) => (
    <p className='leading-6 not-first:mt-2' {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className='my-2 ml-5 list-disc space-y-1' {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className='my-2 ml-5 list-decimal space-y-1' {...props} />
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
  h1: ({ node: _node, ...props }) => (
    <h1 className='mt-3 mb-1 text-base font-semibold first:mt-0' {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h2 className='mt-3 mb-1 text-sm font-semibold first:mt-0' {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h3 className='mt-3 mb-1 text-sm font-semibold first:mt-0' {...props} />
  ),
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
};

/** Markdown an agent wrote, as compact prose, with `mermaid` code blocks as diagrams. */
export function AgMarkdown({
  content,
  className,
}: {
  readonly content: string;
  readonly className?: string;
}): ReactElement {
  return (
    <div className={cn('min-w-0 text-sm wrap-anywhere', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
