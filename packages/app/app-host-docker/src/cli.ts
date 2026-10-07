#!/usr/bin/env node
/**
 * `app-host-docker`: a managed App Host whose Apps run in Docker containers, started by a supervisor (release
 * management) beside the Host that runs Apps in process. It runs no App code itself, so the Docker credentials it is
 * given never sit in a process that runs untrusted code. Host-wide settings are read from `host.backends.docker`:
 * `pollIntervalMs` and `reachTimeoutMs`.
 */
import { runAppHostCli } from '@nocobase/app-host';

import { createDockerBackend } from './backend.js';

runAppHostCli({
  backends: (services) => {
    const { logger, config } = services;
    const settings = config?.backends?.docker ?? {};
    const number = (key: string): number | undefined =>
      typeof settings[key] === 'number' ? settings[key] : undefined;
    return [
      createDockerBackend({
        logger,
        pollIntervalMs: number('pollIntervalMs'),
        reachTimeoutMs: number('reachTimeoutMs'),
      }),
    ];
  },
});
