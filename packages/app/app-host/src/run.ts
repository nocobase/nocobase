import process from 'node:process';

import { watchStartupShutdownSignals } from '@nocobase/app-server/node';

import {
  startAppHostFromEnv,
  type AppHost,
  type StartAppHostOptions,
} from './index.ts';

/**
 * Starts a Host from its environment and configuration and stops it on SIGINT or SIGTERM: the `app-host` executable,
 * and any executable that starts a Host with backends of its own (such as `app-host-docker`).
 */
export function runAppHostCli(options: StartAppHostOptions = {}): void {
  let appHost: AppHost | null = null;
  let shuttingDown = false;

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    if (appHost) {
      appHost.logger.info('Shutting down app host');
      await appHost.close('host shutdown');
    }
    process.exit(0);
  };

  const handleShutdownSignal = (): void => {
    const shutdownPromise = shutdown();
    shutdownPromise.catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
  };

  // Until the host exists there is nothing to shut down, and exiting outright
  // would abandon the migration and seed locks that startup holds. The signal is
  // recorded instead and answered once startup has released them.
  const startupSignals = watchStartupShutdownSignals();

  startAppHostFromEnv(options)
    .then((host) => {
      appHost = host;
      const startupSignal = startupSignals.received();
      startupSignals.dispose();
      if (startupSignal) {
        handleShutdownSignal();
        return;
      }

      process.once('SIGINT', handleShutdownSignal);
      process.once('SIGTERM', handleShutdownSignal);
    })
    .catch((error: unknown) => {
      startupSignals.dispose();
      console.error(error);
      process.exit(1);
    });
}
