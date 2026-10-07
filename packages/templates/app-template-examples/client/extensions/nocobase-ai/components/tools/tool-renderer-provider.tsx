import { useMemo, type PropsWithChildren } from 'react';
import {
  AIToolRendererContext,
  type AIToolRendererMap,
} from './tool-renderer-context.js';
import { builtInToolRenderers } from './builtin-tool-renderers.js';
import { BusinessReportDialogProvider } from './business-report-dialog.js';

export type {
  AIToolRenderer,
  AIToolRendererDefinition,
  AIToolRendererEntry,
  AIToolRendererMap,
  AIToolRendererProps,
} from './tool-renderer-context.js';

export function AIToolRendererProvider({
  renderers,
  children,
}: PropsWithChildren<{ renderers?: AIToolRendererMap }>) {
  const value = useMemo(
    () => ({ ...builtInToolRenderers, ...renderers }),
    [renderers],
  );

  return (
    <BusinessReportDialogProvider>
      <AIToolRendererContext.Provider value={value}>
        {children}
      </AIToolRendererContext.Provider>
    </BusinessReportDialogProvider>
  );
}
