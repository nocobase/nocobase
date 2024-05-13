/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { waitFor, screen } from '@testing-library/react';
import { expect } from 'vitest';

export async function checkSchema(matchObj?: Record<string, any>, name?: string) {
  const objText = screen.queryByTestId(name ? `test-schema-${name}` : `test-schema`);

  await waitFor(() => {
    expect(JSON.parse(objText.textContent)).toMatchObject(matchObj);
  });
}
