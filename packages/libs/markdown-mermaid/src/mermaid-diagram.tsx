// A Mermaid diagram in place of a Markdown code block, drawn in the page's light or dark theme.
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';

import { useColorScheme } from './color-scheme.ts';
import { renderMermaid } from './render.ts';

export interface MermaidDiagramProps {
  readonly source: string;
  /** What shows while Mermaid loads and when the source does not render: the code block as it would be without Mermaid. */
  readonly fallback: ReactNode;
  readonly className?: string;
  /** Waits this long after the source last changed before rendering, so a streamed message renders once it settles. */
  readonly delayMs?: number;
}

interface Drawing {
  /** The source and scheme it was drawn for. */
  readonly key: string;
  readonly svg?: string;
  readonly error?: string;
}

/** A Mermaid diagram, or `fallback` while it loads and when it cannot be rendered. */
export function MermaidDiagram({
  source,
  fallback,
  className,
  delayMs = 150,
}: MermaidDiagramProps): ReactElement {
  const scheme = useColorScheme();
  const key = `${scheme}\n${source}`;
  const [drawing, setDrawing] = useState<Drawing>();

  useEffect(() => {
    let current = true;
    const timer = setTimeout(() => {
      renderMermaid(source, scheme).then(
        (svg) => {
          if (current) setDrawing({ key, svg });
        },
        (error: unknown) => {
          if (current)
            setDrawing({
              key,
              error: error instanceof Error ? error.message : String(error),
            });
        },
      );
    }, delayMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [key, source, scheme, delayMs]);

  const fresh = drawing?.key === key ? drawing : undefined;
  // While the next drawing renders, the previous one stays, so a theme switch does not flash the source.
  const svg = fresh === undefined ? drawing?.svg : fresh.svg;
  if (fresh?.error !== undefined || svg === undefined)
    return (
      <div
        className={className}
        data-mermaid={fresh?.error === undefined ? 'pending' : 'failed'}
        title={fresh?.error}
      >
        {fallback}
      </div>
    );
  return (
    <div
      className={className}
      data-mermaid='diagram'
      // Mermaid built this SVG under `securityLevel: 'strict'`: labels' HTML encoded, no click handlers or scripts.
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
