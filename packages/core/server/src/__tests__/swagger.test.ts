/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import swagger from '../swagger';

describe('core swagger document', () => {
  it('should include split app and pm paths', () => {
    expect(swagger.paths['/pm:add']).toBeDefined();
    expect(swagger.paths['/pm:update']).toBeDefined();
    expect(swagger.paths['/pm:list']).toBeDefined();
    expect(swagger.paths['/pm:listEnabled']).toBeDefined();
    expect(swagger.paths['/pm:listEnabledV2']).toBeDefined();
    expect(swagger.paths['/pm:npmVersionList']).toBeDefined();
    expect(swagger.paths['/pm:get']).toBeDefined();
    expect(swagger.paths['/app:getInfo']).toBeDefined();
  });

  it('should expose plugin manager schemas', () => {
    expect(swagger.components.schemas.PMPlugin).toBeDefined();
    expect(swagger.components.schemas.PMInstallOrUpdatePayload).toBeDefined();
  });
});
