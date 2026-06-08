/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RequiresApproval } from './constants';

export type AIEmployeeInstructionConfig = {
  username: string;
  message: {
    user: string;
    system?: string;
  };
  skillSettings?: {
    skills?: string[];
    tools?: { name: string }[];
    [key: string]: any;
  };
  webSearch?: boolean;
  model?: {
    llmService: string;
    model: string;
  } | null;
  requiresApproval?: RequiresApproval;
  assignees?: string[];
  userId: string;
  files: AIEmployeeInstructionFiles[];
};

export type AIEmployeeInstructionFiles = {
  type: 'attachments' | 'file_id' | 'file_url';
  collection?: string;
  value: string | string[];
};
