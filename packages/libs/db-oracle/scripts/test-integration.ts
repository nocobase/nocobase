import { runDatabaseIntegration } from '@nocobase/db-testkit/integration-runner';
import { integrationService } from './integration-service.js';

const exitCode = await runDatabaseIntegration({
  ...integrationService,
  testArguments: process.argv.slice(2),
});

process.exitCode = exitCode;
