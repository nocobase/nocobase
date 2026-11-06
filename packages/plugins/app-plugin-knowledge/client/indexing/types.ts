import type { ComponentType } from 'react';
import type {
  EmbeddingServiceView,
  IndexingFieldError,
  JsonObject,
} from '../../shared/indexing.js';

export interface IndexingFormProps {
  readonly instance: {
    readonly key: string;
    readonly name: string;
    readonly type: string;
  };
  readonly value: JsonObject;
  readonly onChange: (value: JsonObject) => void;
  readonly errors: readonly IndexingFieldError[];
  readonly disabled: boolean;
  readonly services: readonly EmbeddingServiceView[];
  readonly modelsLoading: boolean;
  readonly modelsError: string | null;
}
export type IndexingFormDefinition = {
  readonly type: string;
  readonly requiresEmbedding?: boolean;
} & (
  | {
      readonly component: ComponentType<IndexingFormProps>;
      readonly load?: never;
    }
  | {
      readonly component?: never;
      readonly load: () => Promise<{
        default: ComponentType<IndexingFormProps>;
      }>;
    }
);
export interface IndexingFormRegistry {
  register(definition: IndexingFormDefinition): () => void;
  get(type: string): IndexingFormDefinition | undefined;
  list(): readonly IndexingFormDefinition[];
  seal(): void;
}
