/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as packageEntry from '../../index';
import * as serverEntry from '../index';

describe('JS Template package entry boundary', () => {
  it('keeps the server and package root entries minimal', () => {
    const expectedKeys = ['PluginJsTemplateServer', 'default', 'registerJsTemplateDomainAvailabilityGuard'];
    expect(Object.keys(serverEntry).sort()).toEqual(expectedKeys);
    expect(Object.keys(packageEntry).sort()).toEqual(expectedKeys);
    expect(serverEntry.default).toBeTypeOf('function');
    expect(serverEntry.PluginJsTemplateServer).toBeTypeOf('function');
    expect(serverEntry.registerJsTemplateDomainAvailabilityGuard).toBeTypeOf('function');
  });
});
