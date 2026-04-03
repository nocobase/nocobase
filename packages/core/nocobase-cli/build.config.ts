import { defineConfig } from '@nocobase/build';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'fs-extra';

function runCommand(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(' ')}`));
    });
  });
}

export default defineConfig({
  beforeBuild: async (log) => {
    const cwd = __dirname;
    await fs.remove(path.join(cwd, 'lib'));
    log('generate swagger commands');
    await runCommand('tsx', ['./scripts/generate-commands.ts'], cwd);
  },
});
