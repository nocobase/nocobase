import { runDatabaseIntegration } from '@nocobase/db-testkit/integration-runner';
import {
  integrationService,
  mariadbIntegrationService,
} from './integration-service.js';

const testArguments = process.argv.slice(2);
const pauseOnFailure =
  process.env.PAUSE_ON_FAILURE === '1' ||
  testArguments.includes('--pause-on-failure');

// One server after the other, never at once: see "Database Integration Test Scheduling" in AGENTS.md.
const services = [integrationService, mariadbIntegrationService];
let exitCode = 0;
for (const [index, service] of services.entries()) {
  const code = await runDatabaseIntegration({ ...service, testArguments });
  if (exitCode === 0) exitCode = code;
  const next = services[index + 1];
  // The runner answers an interrupt with 128 plus the signal number instead of exiting, so stop rather than start the
  // next server.
  if (!next || code >= 128) break;
  // A kept database is still running, and starting the next one beside it is what running one at a time avoids.
  if (process.env.KEEP_TEST_DB === '1' || (pauseOnFailure && code !== 0)) {
    console.error(
      `[db-testkit] Skipping ${next.name} tests while the ${service.name} database is kept.`,
    );
    break;
  }
}

process.exitCode = exitCode;
