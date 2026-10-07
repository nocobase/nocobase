// Mermaid is large, so it is imported the first time a diagram renders and never before. It always runs with
// `securityLevel: 'strict'`, which encodes HTML in labels and turns click handlers off, because the diagrams come from
// what people and agents write.
type Mermaid = (typeof import('mermaid'))['default'];

export type MermaidColorScheme = 'light' | 'dark';

let loading: Promise<Mermaid> | undefined;

/** Imports Mermaid once; a failed import is tried again next time. */
export function loadMermaid(): Promise<Mermaid> {
  loading ??= import('mermaid').then(
    (module) => module.default,
    (error: unknown) => {
      loading = undefined;
      throw error;
    },
  );
  return loading;
}

let queue: Promise<unknown> = Promise.resolve();
let sequence = 0;

/**
 * Renders `source` to an SVG string. Mermaid's configuration is global, so each render sets it and the renders run one
 * at a time; a diagram therefore never takes another's theme.
 */
export function renderMermaid(
  source: string,
  scheme: MermaidColorScheme,
): Promise<string> {
  const task = queue.then(async () => {
    const mermaid = await loadMermaid();
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: scheme === 'dark' ? 'dark' : 'default',
    });
    const id = `nb-mermaid-${String(++sequence)}`;
    try {
      const { svg } = await mermaid.render(id, source);
      return svg;
    } finally {
      // A failed render can leave its scratch element behind in the body.
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
    }
  });
  queue = task.catch(() => undefined);
  return task;
}
