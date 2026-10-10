import type { ReactElement } from 'react';
import { MermaidDiagram } from '@nocobase/markdown-mermaid';

import { highlightDiagram } from '../lib/diagram.js';
import { cn } from '../lib/utils.js';

/** The lifecycle drawn as a state diagram, falling back to its Mermaid source. */
export function FlowDiagram({
  diagram,
  current,
  visited,
  className,
}: {
  readonly diagram: string;
  readonly current?: string | undefined;
  readonly visited?: readonly string[];
  readonly className?: string;
}): ReactElement {
  const source = highlightDiagram(diagram, current, visited);
  return (
    <MermaidDiagram
      source={source}
      className={cn(
        'overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full',
        className,
      )}
      fallback={
        <pre className='overflow-x-auto rounded-md bg-muted px-2 py-1.5 text-xs'>
          {diagram}
        </pre>
      }
    />
  );
}
