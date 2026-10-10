/** What an agent wrote, as compact prose: the installed `markdown-view`, with `mermaid` code blocks drawn as diagrams. */
import { MermaidDiagram } from '@nocobase/markdown-mermaid';
import type { ReactElement } from 'react';
import { Link, useHref } from 'react-router';

import { chatLinkTo } from './chat-links.js';

import { MarkdownView } from '@/components/markdown-view';

export function ChatMarkdown({
  content,
  className,
}: {
  readonly content: string;
  readonly className?: string;
}): ReactElement {
  const basePath = useHref('/');
  return (
    <MarkdownView
      content={content}
      renderLink={(
        { href, children, target: _target, rel: _rel, ...props },
        fallback,
      ) => {
        const to = chatLinkTo(href, basePath, window.location.origin);
        return to === null ? (
          fallback
        ) : (
          <Link to={to} {...props}>
            {children}
          </Link>
        );
      }}
      {...(className ? { className } : {})}
      renderCodeBlock={(code, block) =>
        code.language === 'mermaid' ? (
          <MermaidDiagram
            source={code.source}
            fallback={block}
            className='my-2 overflow-x-auto [&_svg]:mx-auto'
          />
        ) : (
          block
        )
      }
    />
  );
}
