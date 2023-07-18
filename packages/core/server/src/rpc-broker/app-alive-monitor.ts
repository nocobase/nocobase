import { RemoteBroker } from './remote-broker';

// report app alive status to service discovery server
// in every ${monitorInterval} milliseconds
const monitorInterval = 5000;

export class AppAliveMonitor {
  monitors: Map<string, NodeJS.Timeout> = new Map();

  constructor(private remoteBroker: RemoteBroker) {}

  startMonitor(appName: string) {
    const monitor = setTimeout(async () => {
      this.monitor(appName);
    }, monitorInterval);

    this.monitors.set(appName, monitor);
  }

  stopMonitor(appName: string) {
    const monitor = this.monitors.get(appName);

    if (monitor) {
      console.log(`stop monitor app ${appName}`);
      clearTimeout(monitor);
      this.monitors.delete(appName);
    }
  }

  async monitor(appName: string) {
    const app = await this.remoteBroker.appSupervisor.getApp(appName, {
      withOutBootStrap: true,
    });

    if (!app) {
      this.stopMonitor(appName);
      return;
    }

    const isAlive = await app.isAlive();

    if (isAlive) {
      console.log(`app ${appName} is alive`);
      await this.remoteBroker.registerApp(app);
      this.startMonitor(appName);
    } else {
      await this.remoteBroker.unregisterApp(app);
      this.stopMonitor(appName);
    }
  }

  stop() {
    for (const appName of this.monitors.keys()) {
      this.stopMonitor(appName);
    }
  }
}
