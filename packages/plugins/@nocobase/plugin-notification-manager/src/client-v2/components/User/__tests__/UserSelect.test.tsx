/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { expect, it, vi } from 'vitest';

const usersSelect = vi.hoisted(() => vi.fn(() => null));

vi.mock('@nocobase/plugin-workflow/client-v2', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  UsersSelect: usersSelect,
}));

import { UserSelect } from '../UserSelect';

it('uses the shared workflow users selector with nullable receiver support', () => {
  const onChange = vi.fn();
  const variableOptions = [{ name: 'approval', type: '', paths: ['approval'] }];

  render(<UserSelect value="{{$context.data.createdById}}" onChange={onChange} variableOptions={variableOptions} />);

  expect(usersSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      nullable: true,
      onChange,
      value: '{{$context.data.createdById}}',
      variableOptions,
    }),
    expect.anything(),
  );
});
