# @nocobase/markdown-mermaid

Mermaid diagrams for fenced code blocks marked `mermaid` in [react-markdown](https://github.com/remarkjs/react-markdown). Several Markdown renderers that must not import one another, such as an application's and its plugins', share it so that a diagram looks and behaves the same everywhere.

```tsx
import { MermaidDiagram, mermaidSource } from '@nocobase/markdown-mermaid';
import Markdown, { type Components } from 'react-markdown';

const components: Components = {
  pre: ({ node, ...props }) => {
    const block = <pre {...props} />;
    const source = mermaidSource(node);
    return source === undefined ? (
      block
    ) : (
      <MermaidDiagram source={source} fallback={block} />
    );
  },
};

<Markdown components={components}>{content}</Markdown>;
```

- `mermaidSource(node)` returns the diagram source when react-markdown's `pre` node is a code block marked `mermaid`, and undefined otherwise, so every other code block keeps its own rendering.
- `MermaidDiagram` draws the source. Mermaid is imported the first time a diagram renders, so a page without one never loads it. It runs with `securityLevel: 'strict'`, which encodes HTML in labels and turns click handlers off, because diagrams come from what people and agents write.
- The diagram follows the page's theme: Mermaid's `dark` theme while the document element has the `dark` class (as next-themes and shadcn set it), its `default` theme otherwise, and it is drawn again when the class changes.
- `fallback` shows while Mermaid loads, and stays, with the error as its `title`, when the source does not render, so a reader always sees the source. A source that changes, such as a streamed message, is drawn once it has been still for `delayMs` (150 ms by default).
- The wrapper carries `data-mermaid="pending" | "diagram" | "failed"` for styling and tests.
