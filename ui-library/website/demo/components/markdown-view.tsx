import type { ReactElement } from 'react';

import { MarkdownView } from '#components/markdown-view';

const CONTENT = `# Release notes

Thanks [@Grace Hopper](mention://user/u2) for the review.

| Area | Change |
| --- | --- |
| Board | Drag cards between columns |

\`\`\`mermaid
graph LR; Todo-->Done
\`\`\`
`;

export function MarkdownViewDemo(): ReactElement {
  return (
    <div className='max-w-2xl p-6'>
      <MarkdownView
        content={CONTENT}
        renderCodeBlock={(code, block) =>
          code.language === 'mermaid' ? (
            <div className='my-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground'>
              Diagram: {code.source}
            </div>
          ) : (
            block
          )
        }
      />
    </div>
  );
}
