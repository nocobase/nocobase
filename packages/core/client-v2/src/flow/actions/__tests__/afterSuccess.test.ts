/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowRuntimeContext } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { afterSuccess, getAfterSuccessResponseRecord } from '../afterSuccess';

describe('afterSuccess response record variable', () => {
  it('reads the submit response record from the saveResource step', () => {
    const record = { id: 1, title: 'Saved' };

    expect(
      getAfterSuccessResponseRecord({
        steps: {
          confirm: { params: {}, result: undefined },
          saveResource: { params: {}, result: record },
          afterSuccess: { params: {} },
        },
      }),
    ).toBe(record);
  });

  it('injects responseRecord into the afterSuccess runtime context', async () => {
    const record = { id: 1, title: 'Saved' };
    const sourceCtx = {
      steps: {
        saveResource: { params: {}, result: record },
      },
      t: (value: string) => value,
    };
    const properties = await afterSuccess.defineProperties(sourceCtx as FlowRuntimeContext);

    expect(properties.responseRecord.get()).toBe(record);
  });
});
