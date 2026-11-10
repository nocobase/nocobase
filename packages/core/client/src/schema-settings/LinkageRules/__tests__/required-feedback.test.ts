/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { waitFor } from '@testing-library/react';
import { bindLinkageRulesToFiled } from '../bindLinkageRulesToFiled';
import { ActionType } from '../type';

it('revalidates an optional field without clearing independent server feedback', async () => {
  const form = createForm();
  const field = form.createField({ name: 'subject', required: true });
  await expect(field.validate()).rejects.toBeDefined();
  field.setFeedback({ type: 'error', code: 'ServerError', messages: ['Server message'] });
  const rule = { condition: { $and: [] } };
  const dispose = bindLinkageRulesToFiled(
    {
      field,
      action: { operator: ActionType.InRequired },
      rule,
      linkageRules: [rule],
      formValues: form.values,
      localVariables: [],
      variables: undefined,
    },
    {},
  );
  try {
    await waitFor(() => {
      expect(field.required).toBe(false);
      expect(field.selfErrors).toEqual(['Server message']);
    });
  } finally {
    dispose();
  }
});
