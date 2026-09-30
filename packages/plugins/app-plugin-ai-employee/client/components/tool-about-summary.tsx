import type { ReactElement, ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function TextBlock({ children }: { children?: ReactNode }): ReactElement {
  return <span>{children} </span>;
}

/** Keep prose readable without rendering links, images, HTML, or Markdown styling. */
export function ToolAboutSummary({ about }: { about: string }): ReactElement {
  return (
    <span
      className='line-clamp-2 whitespace-normal text-sm font-normal text-muted-foreground [overflow-wrap:anywhere]'
      ref={(element) => {
        if (element)
          element.title =
            element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      }}
    >
      <Markdown
        skipHtml
        unwrapDisallowed
        remarkPlugins={[remarkGfm]}
        allowedElements={[
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'li',
          'pre',
          'br',
          'td',
          'th',
        ]}
        components={{
          p: TextBlock,
          h1: TextBlock,
          h2: TextBlock,
          h3: TextBlock,
          h4: TextBlock,
          h5: TextBlock,
          h6: TextBlock,
          li: TextBlock,
          pre: TextBlock,
          td: TextBlock,
          th: TextBlock,
          br: () => <span> </span>,
        }}
      >
        {about}
      </Markdown>
    </span>
  );
}
