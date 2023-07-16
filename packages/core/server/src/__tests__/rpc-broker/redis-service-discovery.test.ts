import { AppSupervisor } from '../../app-supervisor';

describe('redis service discovery', () => {
  beforeEach(async () => {
    AppSupervisor.getInstance().buildRpcBroker({
      discoveryServerURI: 'redis://localhost:6379',
    });
  });

  it('should register into app', async () => {
    console.log(AppSupervisor.getInstance().getRpcBroker());
  });
});
