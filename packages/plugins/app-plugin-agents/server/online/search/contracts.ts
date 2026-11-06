import type { LanguageModel, ToolChoice, ToolSet } from 'ai';

/** Internal hosted-tool evidence; never exposed as a provider payload or persisted separately. */
export interface NativeSearchEvidence {
  readonly executed: boolean;
  readonly sources: { url: string; title?: string }[];
}

/** Common isolated-call policy. Each adapter adds its own SDK-typed providerOptions. */
export interface NativeSearchCall {
  readonly model: LanguageModel;
  readonly tools: ToolSet;
  readonly toolChoice: ToolChoice<ToolSet>;
  readonly include: { responseBody: true };
  readonly evidence: (body: unknown) => NativeSearchEvidence;
}
