/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type WorkflowLike = {
  type?: string;
  sync?: boolean;
};

export function isResponseMessageInstructionAvailable(workflow?: WorkflowLike) {
  return Boolean(
    workflow?.type === 'request-interception' ||
      (['action', 'custom-action'].includes(String(workflow?.type)) && workflow?.sync),
  );
}
