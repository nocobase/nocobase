import { AppSupervisor } from '../../app-supervisor';
import { LocalBroker } from '../../rpc-broker/local-broker';

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
});
