import { useEffect, useState } from 'react';

/**
 * Refresh candidate lists after Vite has replaced the workflow module index.
 *
 * The workflow Vite plugin loads that index from the page during development
 * and dispatches the event when it changes. This module must not import the
 * index itself: published client code is pre-bundled from node_modules, where
 * a virtual module cannot be resolved. Without the plugin, or in a production
 * build, the event never fires and candidate lists keep their loaded version.
 */
export function useWorkflowSourceUpdate(): number {
  const [update, setUpdate] = useState(0);
  useEffect(() => {
    const refresh = (): void => setUpdate((value) => value + 1);
    window.addEventListener('nocobase:workflow-source-updated', refresh);
    return () =>
      window.removeEventListener('nocobase:workflow-source-updated', refresh);
  }, []);
  return update;
}
