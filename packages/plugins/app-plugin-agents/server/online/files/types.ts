import type { NativeMessage } from '../agent/types.js';
import type { StoredAttachment } from '../../core/conversations/attachments.js';
import type { ModelProviderName } from '../../../shared/models.js';

export type ModelInputProtocol =
  | 'responses'
  | 'messages'
  | 'generate-content'
  | 'chat-completions'
  | 'ollama-chat'
  | 'cohere-chat';
export interface FileInputProfile {
  readonly modelService: string;
  readonly model: string;
  readonly provider: ModelProviderName;
  readonly protocol: ModelInputProtocol;
  readonly baseUrl: string;
  readonly nativeMediaTypes: readonly string[];
  /** Verified Provider limit, bounded by the execution-wide 100-file ceiling. */
  readonly maxNativeFiles?: number;
  /** Overrides the Provider default; remote extraction uploads to this exact service. */
  readonly extraction: 'local' | 'kimi-file-extract';
}
export interface FileInputsConfig {
  /** Exact overrides of legacy Provider defaults; DeepSeek and Cohere stay local unless declared. */
  readonly profiles?: readonly FileInputProfile[];
}
/** Descriptions come from owned stored message rows, never URL-derived authorization. */
export interface ExecutionFile {
  readonly messageId: string;
  readonly partIndex: number;
  readonly attachment?: StoredAttachment;
}
export interface ExecutionSnapshot {
  readonly original: NativeMessage[];
  readonly replay: NativeMessage[];
  readonly files: readonly ExecutionFile[];
}
