/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chmod, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { VscGitRemoteTransport } from '../../../../../shared/vsc-file/remote-sync-types';
import { parseGitRemoteCredential } from './gitConfig';

export const gitCommandTemporaryDirectoryPrefix = 'nocobase-git-command-';

const askpassScript = `#!/bin/sh
case "$NBS_GIT_ASKPASS_MODE:$1" in
  https:*sername*) printf '%s\\n' "$NBS_GIT_HTTPS_USERNAME" ;;
  https:*) printf '%s\\n' "$NBS_GIT_HTTPS_PASSWORD" ;;
  ssh:*) printf '%s\\n' "$NBS_GIT_SSH_PASSPHRASE" ;;
  *) exit 1 ;;
esac
`;

const sshWrapperScript = `#!/bin/sh
exec "$NBS_GIT_SSH_BINARY" -F /dev/null \
  -o IdentitiesOnly=yes \
  -o IdentityAgent=none \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile="$NBS_GIT_SSH_KNOWN_HOSTS" \
  -o GlobalKnownHostsFile=/dev/null \
  -o PasswordAuthentication=no \
  -o KbdInteractiveAuthentication=no \
  -o ChallengeResponseAuthentication=no \
  -i "$NBS_GIT_SSH_PRIVATE_KEY" \
  "$@"
`;

export interface GitCredentialMaterializerOptions {
  temporaryDirectory?: string;
}

export interface GitCredentialMaterializationRequest {
  transport: VscGitRemoteTransport;
  credential?: unknown;
  sshBinary?: string;
}

export interface MaterializedGitCredential {
  rootDirectory: string;
  homeDirectory: string;
  xdgConfigDirectory: string;
  hooksDirectory: string;
  credentialDirectory: string;
  environment: Readonly<NodeJS.ProcessEnv>;
  cleanup(): Promise<void>;
}

export class GitCredentialMaterializer {
  private readonly temporaryDirectory: string;

  constructor(options: GitCredentialMaterializerOptions = {}) {
    this.temporaryDirectory = options.temporaryDirectory || os.tmpdir();
  }

  async materialize(request: GitCredentialMaterializationRequest): Promise<MaterializedGitCredential> {
    const credential =
      request.credential === null || request.credential === undefined
        ? null
        : parseGitRemoteCredential(request.credential, request.transport);
    await mkdir(this.temporaryDirectory, { recursive: true, mode: 0o700 });
    const rootDirectory = await mkdtemp(path.join(this.temporaryDirectory, gitCommandTemporaryDirectoryPrefix));
    let cleaned = false;

    const cleanup = async () => {
      if (cleaned) {
        return;
      }
      await rm(rootDirectory, { force: true, recursive: true });
      cleaned = true;
    };

    try {
      await chmod(rootDirectory, 0o700);
      const homeDirectory = path.join(rootDirectory, 'home');
      const xdgConfigDirectory = path.join(rootDirectory, 'xdg');
      const hooksDirectory = path.join(rootDirectory, 'hooks');
      const credentialDirectory = path.join(rootDirectory, 'credentials');
      await Promise.all(
        [homeDirectory, xdgConfigDirectory, hooksDirectory, credentialDirectory].map((directory) =>
          mkdir(directory, { mode: 0o700 }),
        ),
      );

      const environment: NodeJS.ProcessEnv = {
        GIT_TERMINAL_PROMPT: '0',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
        HOME: homeDirectory,
        XDG_CONFIG_HOME: xdgConfigDirectory,
      };

      if (request.transport === 'ssh' && credential === null) {
        environment.HOME = process.env.HOME || os.homedir();
        if (process.env.SSH_AUTH_SOCK) {
          environment.SSH_AUTH_SOCK = process.env.SSH_AUTH_SOCK;
        }
      }

      if (credential?.kind === 'https') {
        const askpassPath = path.join(credentialDirectory, 'askpass.sh');
        await writeFile(askpassPath, askpassScript, { encoding: 'utf8', mode: 0o700 });
        environment.GIT_ASKPASS = askpassPath;
        environment.NBS_GIT_ASKPASS_MODE = 'https';
        environment.NBS_GIT_HTTPS_USERNAME = credential.username;
        environment.NBS_GIT_HTTPS_PASSWORD = credential.password;
      }

      if (credential?.kind === 'ssh') {
        const privateKeyPath = path.join(credentialDirectory, 'private-key');
        const knownHostsPath = path.join(credentialDirectory, 'known-hosts');
        const askpassPath = path.join(credentialDirectory, 'askpass.sh');
        const sshWrapperPath = path.join(credentialDirectory, 'ssh-wrapper.sh');
        await Promise.all([
          writeFile(privateKeyPath, credential.privateKey, { encoding: 'utf8', mode: 0o600 }),
          writeFile(knownHostsPath, credential.knownHosts, { encoding: 'utf8', mode: 0o600 }),
          writeFile(askpassPath, askpassScript, { encoding: 'utf8', mode: 0o700 }),
          writeFile(sshWrapperPath, sshWrapperScript, { encoding: 'utf8', mode: 0o700 }),
        ]);
        environment.GIT_SSH = sshWrapperPath;
        environment.GIT_SSH_VARIANT = 'ssh';
        environment.SSH_ASKPASS = askpassPath;
        environment.SSH_ASKPASS_REQUIRE = 'force';
        environment.DISPLAY = 'nocobase-git-askpass';
        environment.NBS_GIT_ASKPASS_MODE = 'ssh';
        environment.NBS_GIT_SSH_BINARY = request.sshBinary || 'ssh';
        environment.NBS_GIT_SSH_PRIVATE_KEY = privateKeyPath;
        environment.NBS_GIT_SSH_KNOWN_HOSTS = knownHostsPath;
        environment.NBS_GIT_SSH_PASSPHRASE = credential.passphrase || '';
      }

      return {
        rootDirectory,
        homeDirectory,
        xdgConfigDirectory,
        hooksDirectory,
        credentialDirectory,
        environment,
        cleanup,
      };
    } catch (error) {
      await cleanup();
      throw error;
    }
  }

  async cleanupOrphans(ttlMs: number, now = Date.now()): Promise<number> {
    if (!Number.isFinite(ttlMs) || ttlMs < 0) {
      throw new TypeError('Git command temporary directory TTL must be a non-negative finite number');
    }

    let entries;
    try {
      entries = await readdir(this.temporaryDirectory, { withFileTypes: true });
    } catch (error) {
      if (isNodeErrorWithCode(error, 'ENOENT')) {
        return 0;
      }
      throw error;
    }

    let removed = 0;
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith(gitCommandTemporaryDirectoryPrefix)) {
        continue;
      }
      const directory = path.join(this.temporaryDirectory, entry.name);
      try {
        const metadata = await stat(directory);
        if (now - metadata.mtimeMs <= ttlMs) {
          continue;
        }
        await rm(directory, { force: true, recursive: true });
        removed += 1;
      } catch (error) {
        if (!isNodeErrorWithCode(error, 'ENOENT')) {
          throw error;
        }
      }
    }
    return removed;
  }
}

function isNodeErrorWithCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
