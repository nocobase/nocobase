/** What an agent wrote, as compact prose: the installed `markdown-view`, with `mermaid` code blocks drawn as diagrams. */
import { MermaidDiagram } from '@nocobase/markdown-mermaid';
import type { ReactElement } from 'react';

import { MarkdownView } from '@/components/markdown-view';

export function ChatMarkdown({
  content,
  className,
}: {
  readonly content: string;
  readonly className?: string;
}): ReactElement {
  return (
    <MarkdownView
      content={content}
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
