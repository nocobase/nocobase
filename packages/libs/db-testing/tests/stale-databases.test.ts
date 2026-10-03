import { spawnSync } from 'node:child_process';
import type { TestDatabaseProvisioner } from '@nocobase/db/testing';
import { describe, expect, it } from 'vitest';
import {
  loadTestDatabaseProvisioner,
  provisionTestDatabases,
} from '../src/index.js';

// A process id that is certainly gone: a child that has already exited.
const exitedPid = spawnSync(process.execPath, ['-e', '']).pid;

describe('isolated databases left behind by an interrupted run', () => {
  it('are dropped when their process is gone and kept while it runs', async () => {
    const sqlite = await loadTestDatabaseProvisioner('sqlite');
    const dropped: string[] = [];
    let prefix = '';
    const provisioner: TestDatabaseProvisioner = {
      dialect: 'sqlite',
      capabilities: sqlite.capabilities,
      provision: (options) => sqlite.provision(options),
      listProvisioned: (options) => {
        prefix = options.prefix;
        return Promise.resolve([
          `${prefix}${exitedPid}_1_1_aaaaaa_0`,
          `${prefix}${process.pid}_1_1_bbbbbb_0`,
          `${prefix}${process.ppid}_1_1_cccccc_0`,
          `${prefix}not_a_pid`,
        ]);
      },
      dropProvisioned: ({ name }) => {
        dropped.push(name);
        return Promise.resolve();
      },
    };

    const databases = await provisionTestDatabases({ provisioner });
    await databases.drop();

    expect(prefix).toMatch(/^nbt_[a-z0-9]{7}_$/);
    expect(dropped).toEqual([`${prefix}${exitedPid}_1_1_aaaaaa_0`]);
  });

  it('never stop a run when they cannot be listed', async () => {
    const sqlite = await loadTestDatabaseProvisioner('sqlite');
    const provisioner: TestDatabaseProvisioner = {
      dialect: 'sqlite',
      capabilities: sqlite.capabilities,
      provision: (options) => sqlite.provision(options),
      listProvisioned: () => Promise.reject(new Error('permission denied')),
      dropProvisioned: () => Promise.resolve(),
    };
    const databases = await provisionTestDatabases({ provisioner });
    await databases.drop();
  });
});
