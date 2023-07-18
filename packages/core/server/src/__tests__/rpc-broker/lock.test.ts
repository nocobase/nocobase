import { AppSupervisor } from '../../app-supervisor';
import { LocalBroker } from '../../rpc-broker/local-broker';
import { RemoteBroker } from '../../rpc-broker/remote-broker';

describe('lock test', () => {
  describe('local broker', () => {
    let localBroker: LocalBroker;

    beforeEach(async () => {
      localBroker = new LocalBroker(AppSupervisor.getInstance());
    });

    afterEach(async () => {
      await localBroker.destroy();
    });

    it('should acquire lock', async () => {
      const lock = await localBroker.acquireLock({ lockName: 'test' });
      expect(lock).toBeTruthy();

      const lock2 = await localBroker.acquireLock({ lockName: 'test', maxRetries: 2, retryDelay: 100 });
      expect(lock2).toBeFalsy();
    });
  });

  describe('remote broker', () => {
    let remoteBroker: RemoteBroker;

    beforeEach(async () => {
      remoteBroker = new RemoteBroker(AppSupervisor.getInstance(), {
        discoveryServerURI: process.env['REDIS_URI'] || 'redis://localhost:6379',
      });
    });

    afterEach(async () => {
      await remoteBroker.destroy();
    });

    it('should acquire lock', async () => {
      const lock = await remoteBroker.acquireLock({ lockName: 'test' });
      expect(lock).toBeTruthy();

      const lock2 = await remoteBroker.acquireLock({ lockName: 'test', maxRetries: 2, retryDelay: 100 });
      expect(lock2).toBeFalsy();

      await remoteBroker.releaseLock('test', lock);

      const lock3 = await remoteBroker.acquireLock({ lockName: 'test', maxRetries: 2, retryDelay: 100 });
      expect(lock3).toBeTruthy();
    });
  });
});
