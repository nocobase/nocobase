/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { defaultWorkflowFilter } from '../../../common/defaultWorkflowFilter';
import { workflowSchema } from '../workflows';

describe('workflowSchema filter defaults', () => {
  it('uses the shared name + trigger-type default filter', () => {
    // @ts-ignore
    const filter = workflowSchema.properties?.provider?.properties?.main?.properties?.actions?.properties?.filter;

    expect(filter?.default).toEqual(defaultWorkflowFilter);
  });
});
