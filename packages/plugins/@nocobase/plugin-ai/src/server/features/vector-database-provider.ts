/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EmbeddingsInterface } from '@langchain/core/embeddings';

export interface VectorDatabaseProviderFeature {
  register<T, R>(providerInfo: VectorDatabaseProviderInfo<T, R>): void;
  validateConnectParams<T>(providerName: string, connectParams: T): void;
  createVectorStore<T, R>(providerName: string, embeddings: EmbeddingsInterface, connectParams: T): Promise<R>;
  listProviders(): VectorDatabaseProviderInfo<unknown, unknown>[];
}

export type VectorDatabaseProviderInfo<T, R> = {
  name: string;
  spec: string;
  provider: VectorDatabaseProvider<T, R>;
};

export type VectorDatabaseProvider<T, R> = {
  validateConnectParams(connectParams: T): void;
  createVectorStore(embeddings: EmbeddingsInterface, connectParams: T): Promise<R>;
};
