/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { VectorStore } from '@langchain/core/vectorstores';
import { VectorStoreProp } from '../types';

export interface VectorStoreProviderFeature {
  register(vsp: VectorStoreProvider): void;
  createVectorStoreService(providerName: string, vectorStoreProps?: VectorStoreProp[]): Promise<VectorStoreService>;
}

export interface VectorStoreProvider {
  providerName: string;
  createVectorStoreService(vectorStoreProps?: VectorStoreProp[]): Promise<VectorStoreService>;
}

export interface VectorStoreService {
  getVectorStore(): Promise<VectorStore>;
  search(query: string, options?: VectorStoreSearchOptions): Promise<DocumentSegmentedWithScore[]>;
}

export type VectorStoreSearchOptions = {
  topK?: number;
  score?: string;
  filter?: any;
};

export type DocumentSegmented = {
  content: string;
  metadata: Record<string, any>;
  id?: string;
};

export type DocumentSegmentedWithScore = DocumentSegmented & {
  score: number;
};
