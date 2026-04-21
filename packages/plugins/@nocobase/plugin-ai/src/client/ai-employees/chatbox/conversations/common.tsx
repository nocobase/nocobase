/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Empty } from 'antd';

export type WorkflowTask = {
  id: string;
  sessionId: string;
  executionId?: number | string;
  workflowTitle: string;
  nodeTitle: string;
  status: string;
  jobStatus?: number;
  read?: boolean;
  config?: {
    username?: string;
    [key: string]: any;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkflowTaskOutputSchema = {
  title?: string;
  type?: string;
  properties?: Record<string, WorkflowTaskOutputSchema>;
};

export type WorkflowTaskDetail = WorkflowTask & {
  readonly?: boolean;
  structuredOutputSchema?: WorkflowTaskOutputSchema | string | null;
  config?: {
    username?: string;
    model?: {
      llmService: string;
      model: string;
    } | null;
    [key: string]: any;
  } | null;
};

export const ListEmpty: React.FC = () => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
