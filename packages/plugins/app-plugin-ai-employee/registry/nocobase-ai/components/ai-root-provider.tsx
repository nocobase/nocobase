import { useApiClient } from '@nocobase/app-client';
import { useMemo } from 'react';

import { AIProvider, type AIProviderProps } from '../providers/ai-provider.js';
import { NocoBaseAIService } from '../services/index.js';
import { AIPageElementProvider } from './page-elements/page-element-provider.js';
import {
  AIToolRendererProvider,
  type AIToolRendererMap,
} from './tools/tool-renderer-provider.js';
import type { AIPageContextFailurePolicy } from './page-elements/page-element-store.js';

export type NocoBaseAIRootProviderProps = Omit<AIProviderProps, 'service'> & {
  /** Replaces the service built from the application's `ApiClient`. */
  service?: AIProviderProps['service'];
  toolRenderers?: AIToolRendererMap;
  contextFailurePolicy?: AIPageContextFailurePolicy;
};

export function NocoBaseAIRootProvider({
  children,
  toolRenderers,
  contextFailurePolicy,
  service: providedService,
  ...aiProviderProps
}: NocoBaseAIRootProviderProps) {
  const api = useApiClient();
  const service = useMemo(
    () => providedService ?? new NocoBaseAIService(api),
    [api, providedService],
  );
  return (
    <AIProvider {...aiProviderProps} service={service}>
      <AIToolRendererProvider renderers={toolRenderers}>
        <AIPageElementProvider contextFailurePolicy={contextFailurePolicy}>
          {children}
        </AIPageElementProvider>
      </AIToolRendererProvider>
    </AIProvider>
  );
}
