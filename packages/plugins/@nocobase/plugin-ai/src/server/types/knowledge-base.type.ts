/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type KnowledgeBaseType = 'LOCAL' | 'READONLY' | 'EXTERNAL';

export type VectorStoreProp = {
  name?: string;
  key: string;
  value: string;
};

export type KnowledgeBase = {
  knowledgeBaseType: KnowledgeBaseType;
  knowledgeBaseOuterId: string;
  name: string;
  description: string;
  vectorStoreProvider: string;
  vectorStoreConfigId?: string;
  vectorStoreProps?: VectorStoreProp[];
  enabled: boolean;
};

export type VectorStoreConfig = {
  vectorStoreProvider: string;
  vectorStoreConfigId?: string;
};

export type KnowledgeBaseGroup = {
  vectorStoreConfig: VectorStoreConfig;
  knowledgeBaseType: KnowledgeBaseType;
  knowledgeBaseList: KnowledgeBase[];
};
