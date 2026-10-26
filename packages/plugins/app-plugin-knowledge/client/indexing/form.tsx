import { Suspense, useEffect, type ReactElement, type ReactNode } from 'react';
import { useIndexingForms } from './context.js';
import type { IndexingFormProps } from './types.js';

function Ready({
  onReady,
}: {
  readonly onReady: (() => void) | undefined;
}): null {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

/** Missing forms are explicit: the caller must retain the saved JSON and prevent editing. */
export function IndexingForm({
  loading,
  unavailable,
  onReady,
  ...props
}: IndexingFormProps & {
  readonly loading: ReactNode;
  readonly unavailable: ReactNode;
  readonly onReady?: () => void;
}): ReactElement {
  const definition = useIndexingForms().get(props.instance.type);
  const Component = definition?.component;
  return Component ? (
    <Suspense fallback={loading}>
      <Component {...props} />
      <Ready onReady={onReady} />
    </Suspense>
  ) : (
    <>{unavailable}</>
  );
}
