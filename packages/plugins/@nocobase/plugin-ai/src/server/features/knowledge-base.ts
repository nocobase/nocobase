/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { KnowledgeBase, KnowledgeBaseGroup } from '../types';

export interface KnowledgeBaseFeature {
  getKnowledgeBase(knowledgeBaseKeys: string[]): Promise<KnowledgeBase[]>;
  getKnowledgeBaseGroup(knowledgeBaseKeys: string[]): Promise<KnowledgeBaseGroup[]>;
}
