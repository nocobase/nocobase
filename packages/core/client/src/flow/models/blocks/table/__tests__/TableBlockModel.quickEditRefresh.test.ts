/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';

describe('TableBlockModel quick edit refresh', () => {
  it('updates table data through a new array reference after quick editing a flat row', () => {
    const engine = new FlowEngine();
    const resource = engine.context.createResource(MultiRecordResource);
    const original = [
      { id: 1, title: 'old title', status: 'draft' },
      { id: 2, title: 'other title', status: 'published' },
    ];

    resource.setData(original);
    const before = resource.getData();
    const editedRecord = { ...before[0], title: 'new title' };

    resource.setItem(0, editedRecord);

    expect(resource.getData()).not.toBe(before);
    expect(resource.getData()[0]).toEqual(editedRecord);
    expect(resource.getData()[1]).toEqual(original[1]);
  });

  it('notifies mounted JS fields after quick editing local table data', () => {
    const engine = new FlowEngine();
    const resource = engine.context.createResource(MultiRecordResource);
    const original = [{ id: 1, title: 'old title', status: 'draft' }];
    let refreshCount = 0;
    resource.on('refresh', () => {
      refreshCount += 1;
    });

    resource.setData(original);
    const editedRecord = { ...resource.getData()[0], title: 'new title' };
    resource.setItem(0, editedRecord);
    resource.emit('refresh');

    expect(refreshCount).toBe(1);
  });
});
