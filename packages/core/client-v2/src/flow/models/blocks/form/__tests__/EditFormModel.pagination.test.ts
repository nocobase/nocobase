/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { expect, it, vi } from 'vitest';
import { EditFormModel } from '../EditFormModel';

it('leaves the record and draft in place until discard is confirmed', async () => {
  const engine = new FlowEngine();
  const model = new EditFormModel({ uid: 'edit', flowEngine: engine });
  const resource = new MultiRecordResource(model.context);
  resource.setPage(1);
  resource.setData([{ id: 1, name: 'B' }]);
  const refresh = vi.spyOn(resource, 'refresh').mockResolvedValue(undefined);
  const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  model.context.defineProperty('resource', { value: resource });
  model.context.defineProperty('form', { value: { getFieldValue: () => 'draft' } });
  model.context.defineProperty('modal', { value: { confirm } });
  model.markUserModifiedFields({ name: 'draft' });
  await model.handlePageChange(2);
  expect(resource.getPage()).toBe(1);
  expect(refresh).not.toHaveBeenCalled();
  expect(model.getUserModifiedFields().has('name')).toBe(true);
  await model.handlePageChange(2);
  expect(resource.getPage()).toBe(2);
  expect(refresh).toHaveBeenCalledOnce();
  model.resetUserModifiedFields();
  await model.handlePageChange(1);
  expect(confirm).toHaveBeenCalledTimes(2);
});
