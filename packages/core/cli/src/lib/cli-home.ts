import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CLI_HOME_DIRNAME = '.nocobase-ctl';
export type CliHomeScope = 'auto' | 'project' | 'global';

function resolveGlobalCliHomeRoot() {
  if (process.env.NOCOBASE_CTL_HOME) {
    return process.env.NOCOBASE_CTL_HOME;
  }

  return os.homedir();
}

export function resolveCliHomeRoot(scope: CliHomeScope = 'auto') {
  const cwdRoot = process.cwd();
  if (scope === 'project') {
    return cwdRoot;
  }

  if (scope === 'global') {
    return resolveGlobalCliHomeRoot();
  }

  const cwdCliHome = path.join(cwdRoot, CLI_HOME_DIRNAME);
  if (fs.existsSync(cwdCliHome)) {
    return cwdRoot;
  }

  return resolveGlobalCliHomeRoot();
}

export function resolveCliHomeDir(scope: CliHomeScope = 'auto') {
  return path.join(resolveCliHomeRoot(scope), CLI_HOME_DIRNAME);
}

export function formatCliHomeScope(scope: Exclude<CliHomeScope, 'auto'>) {
  return scope === 'project' ? 'project' : 'global';
}
