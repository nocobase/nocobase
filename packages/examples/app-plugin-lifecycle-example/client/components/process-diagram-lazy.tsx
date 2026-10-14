import {
  lazy,
  Suspense,
  type ComponentProps,
  type LazyExoticComponent,
  type ReactElement,
} from 'react';

import type { ProcessDiagram as DiagramComponent } from './process-diagram.js';

const Diagram: LazyExoticComponent<typeof DiagramComponent> = lazy(() =>
  import('./process-diagram.js').then((module) => ({
    default: module.ProcessDiagram,
  })),
);

/** Load the diagram engine and its styles only when a diagram is rendered. */
export function ProcessDiagram(
  props: ComponentProps<typeof DiagramComponent>,
): ReactElement {
  return (
    <Suspense fallback={null}>
      <Diagram {...props} />
    </Suspense>
  );
}
