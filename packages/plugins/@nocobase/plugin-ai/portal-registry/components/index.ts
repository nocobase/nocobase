export {
  NocoBaseAIRootProvider,
  type NocoBaseAIRootProviderProps,
} from "./ai-root-provider";
export { AIChatWindow, type AIChatWindowProps } from "./chat/chat-window";
export { ChatComposer, type AIChatComposerAction } from "./chat/chat-composer";
export { AIChatCompact, type AIChatCompactProps } from "./chat/chat-compact";
export { AIChatHistoryDialog } from "./chat/chat-history-dialog";
export {
  AIChatMessageList,
  ChatMessages,
  type AIChatMessageListProps,
} from "./chat/chat-messages";
export { AIModelSelectOptions } from "./chat/model-select-options";
export { ChatDialog } from "./surfaces/chat-dialog";
export {
  ChatSurface,
  type ChatSurfaceProps,
  type ChatSurfaceVariant,
} from "./surfaces/chat-surface";
export { ChatSurfaceActions } from "./surfaces/chat-surface-actions";
export { ChatInline } from "./surfaces/chat-inline";
export { ChatPage } from "./surfaces/chat-page";
export {
  ChatSidePanel,
  type ChatSidePanelProps,
} from "./surfaces/chat-side-panel";
export {
  ChatSidePanelLayout,
  type ChatSidePanelLayoutProps,
} from "./surfaces/chat-side-panel-layout";
export {
  AIChatFloatingTrigger,
  type AIChatFloatingTriggerProps,
} from "./triggers/ai-chat-floating-trigger";
export {
  AIEmployeeShortcut,
  type AIEmployeeShortcutProps,
} from "./triggers/ai-employee-shortcut";
export {
  AIPageElementProvider,
  useAIPageElement,
  useAIPageElementHandle,
  useAIPageElementPicker,
  AIPageContextResolutionError,
  type AIPageContextFailurePolicy,
  type AIPageElementDescriptor,
  type AIPageElementHandle,
  type AIPageElementPickerOptions,
  type AIPageElementProviderProps,
} from "./page-elements/page-element-provider";
export {
  useAIForm,
  type AIFormDescriptor,
} from "./page-elements/ai-form";
export {
  AIToolRendererProvider,
  useAIToolRenderer,
  type AIToolRenderer,
  type AIToolRendererDefinition,
  type AIToolRendererEntry,
  type AIToolRendererMap,
  type AIToolRendererProps,
} from "./tools/tool-renderer-provider";
