/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import FlowModelRepository from '../repository';

describe('flow-model ensure', () => {
  let app: MockServer;
  let repository: FlowModelRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  it('should ensure by uid (create when missing, return when exists)', async () => {
    const created = await repository.ensureModel({ uid: 'ensure-root', use: 'RouteModel' });
    expect(created).toBeTruthy();
    expect(created.uid).toBe('ensure-root');
    expect(created.use).toBe('RouteModel');

    const ensuredAgain = await repository.ensureModel({ uid: 'ensure-root', use: 'AnotherModel' });
    expect(ensuredAgain).toBeTruthy();
    expect(ensuredAgain.uid).toBe('ensure-root');
    // should not overwrite existing model
    expect(ensuredAgain.use).toBe('RouteModel');
  });

  it('should ensure object child by (parentId+subKey) concurrently', async () => {
    await repository.insertModel({ uid: 'ensure-parent', use: 'ParentModel' } as any);

    const [a, b] = await Promise.all([
      repository.ensureModel({
        parentId: 'ensure-parent',
        subKey: 'page',
        subType: 'object',
        use: 'RootPageModel',
        async: true,
      }),
      repository.ensureModel({
        parentId: 'ensure-parent',
        subKey: 'page',
        subType: 'object',
        use: 'RootPageModel',
        async: true,
      }),
    ]);

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a.uid).toBe(b.uid);

    const parent = await repository.findModelById('ensure-parent', { includeAsyncNode: true });
    expect(parent.subModels?.page).toBeTruthy();
    expect(parent.subModels.page.uid).toBe(a.uid);
  });
});
