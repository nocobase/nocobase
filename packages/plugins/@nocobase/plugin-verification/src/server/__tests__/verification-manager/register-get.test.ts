/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Verification } from '../../verification';
import { VerificationManager } from '../../verification-manager';

class MockVerification extends Verification {
  async verify() {}
}

describe('verification-manager, register and get', async () => {
  let manager: VerificationManager;

  beforeEach(async () => {
    manager = new VerificationManager({ db: {} as any });
  });

  it('register verification type', async () => {
    manager.registerVerificationType('test', {
      title: 'Test',
      description: 'Test description',
      verification: MockVerification,
    });
    const options = manager.verificationTypes.get('test');
    expect(options.title).toBe('Test');
    expect(options.description).toBe('Test description');
    expect(options.verification).toBe(MockVerification);
    const verification = manager.getVerification('test');
    expect(verification).toBe(MockVerification);
  });

  it('list types', async () => {
    manager.registerVerificationType('test1', {
      title: 'Test1',
      verification: MockVerification,
    });
    manager.registerVerificationType('test2', {
      title: 'Test2',
      verification: MockVerification,
    });
    const types = manager.listTypes();
    expect(types).toEqual([
      { name: 'test1', title: 'Test1' },
      { name: 'test2', title: 'Test2' },
    ]);
  });

  it('add scene rule', async () => {
    manager.registerVerificationType('test', {
      title: 'Test',
      verification: MockVerification,
    });
    manager.addSceneRule((scene, verificationType) => scene === 'testScene' && verificationType === 'test');
    const types = manager.getVerificationTypesByScene('testScene');
    expect(types).toEqual([{ type: 'test', title: 'Test' }]);
  });
});
