import {
  AIProvider,
  type AIProviderProps,
} from "../providers/ai-provider";
import { AIPageElementProvider } from "./page-elements/page-element-provider";
import {
  AIToolRendererProvider,
  type AIToolRendererMap,
} from "./tools/tool-renderer-provider";
import type { AIPageContextFailurePolicy } from "./page-elements/page-element-provider";

export type NocoBaseAIRootProviderProps = AIProviderProps & {
  toolRenderers?: AIToolRendererMap;
  contextFailurePolicy?: AIPageContextFailurePolicy;
};

export function NocoBaseAIRootProvider({
  children,
  toolRenderers,
  contextFailurePolicy,
  ...aiProviderProps
}: NocoBaseAIRootProviderProps) {
  return (
    <AIProvider {...aiProviderProps}>
      <AIToolRendererProvider renderers={toolRenderers}>
        <AIPageElementProvider contextFailurePolicy={contextFailurePolicy}>
          {children}
        </AIPageElementProvider>
      </AIToolRendererProvider>
    </AIProvider>
  );
}
