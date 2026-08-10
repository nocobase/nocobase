/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import * as tar from 'tar';
import { executeApiRequest, type RequestOperation } from './api-client.js';
import { translateCli } from './cli-locale.js';
import { ensurePortalBuildHtmlReadsEnvOnly } from './portal-build-html.js';
import {
  buildPortalBasePath,
  resolvePortalAppContext,
  resolvePortalEnvApiUrl,
  resolveSavedPortalSourcePath,
  resolvePortalSourcePath,
  titleFromPortalSlug,
  validatePortalSlug,
  type PortalCreateEnvLike,
} from './portal-create.js';
import { buildPortalCommandEnv } from './portal-command-env.js';
import { updatePortalEnvFiles } from './portal-env-files.js';
import { resolvePnpmInstallCommand, run, runPnpmCommand, runPnpmInstallCommand, type RunCommand } from './run-npm.js';

type ApiRequest = typeof executeApiRequest;

export type PortalDeployEnvLike = PortalCreateEnvLike;

export type PortalDeployOptions = {
  portal: string;
  env: PortalDeployEnvLike;
  envName?: string;
  cliVersion?: string;
  installDependencies?: boolean;
  runCommand?: RunCommand;
  apiRequest?: ApiRequest;
};

export type PortalDeployMode = 'local' | 'docker' | 'http';

export type PortalDeployResult = {
  app: string;
  portal: string;
  portalDir: string;
  portalBase: string;
  distDir: string;
  serverDistPath?: string;
  mode: PortalDeployMode;
  uploaded: boolean;
  recordSynced: boolean;
};

type PortalDeployUploadResult = {
  distPath?: string;
};

const PORTAL_DIST_DIR = 'dist';
const PORTAL_CLIENT_DIST_DIR = path.join(PORTAL_DIST_DIR, 'client');

const portalDeployText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.portalDeploy.${key}`, values, { fallback });

const DEPLOY_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:deploy',
  requestContentType: 'multipart/form-data',
  hasBody: true,
  bodyRequired: true,
  parameters: [
    {
      name: 'file',
      flagName: 'file',
      in: 'body',
      required: true,
      isFile: true,
    },
    {
      name: 'app',
      flagName: 'app',
      in: 'body',
      required: true,
    },
    {
      name: 'portal',
      flagName: 'portal',
      in: 'body',
      required: true,
    },
    {
      name: 'basePath',
      flagName: 'basePath',
      in: 'body',
      required: true,
    },
  ],
};

const FIRST_OR_CREATE_PORTAL_OPERATION: RequestOperation = {
  method: 'POST',
  pathTemplate: '/multiPortals:firstOrCreate',
  hasBody: true,
  bodyRequired: true,
  parameters: [
    {
      name: 'filterKeys[]',
      flagName: 'filterKeys',
      in: 'query',
      required: true,
      isArray: true,
    },
  ],
};

const DEFAULT_PORTAL_UI_LAYOUT_UID = 'admin-layout-model';
const PORTAL_PUBLIC_DIR_MODE = 0o755;
const PORTAL_PUBLIC_FILE_MODE = 0o644;
const CLEAN_DIST_BIN_SCRIPT_PATH = path.join('scripts', 'clean-dist-bin.mjs');
const CLEAN_DIST_BIN_COMMAND = 'node ./scripts/clean-dist-bin.mjs';
const CLEAN_DIST_BIN_SCRIPT = `import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distBinDir = path.join(rootDir, "dist", "node_modules", ".bin");

fs.rmSync(distBinDir, { recursive: true, force: true });
`;

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function readDistPathFromUploadResponse(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }

  const directDistPath = (data as { distPath?: unknown }).distPath;
  if (typeof directDistPath === 'string' && directDistPath.trim()) {
    return directDistPath;
  }

  return readDistPathFromUploadResponse((data as { data?: unknown }).data);
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function chmodPortalDistTree(targetDir: string): Promise<void> {
  await chmod(targetDir, PORTAL_PUBLIC_DIR_MODE);
  const entries = await readdir(targetDir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await chmodPortalDistTree(entryPath);
        return;
      }
      if (entry.isFile()) {
        await chmod(entryPath, PORTAL_PUBLIC_FILE_MODE);
      }
    }),
  );
}

async function assertFileExists(filePath: string, message: string): Promise<void> {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      return;
    }
  } catch {
    // Throw the normalized message below.
  }
  throw new Error(message);
}

async function readPortalPackageScripts(portalDir: string): Promise<Record<string, string>> {
  const content = await readFile(path.join(portalDir, 'package.json'), 'utf-8');
  const packageJson: unknown = JSON.parse(content);
  const scripts =
    packageJson && typeof packageJson === 'object' && !Array.isArray(packageJson)
      ? (packageJson as { scripts?: unknown }).scripts
      : undefined;
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    return {};
  }
  return Object.fromEntries(Object.entries(scripts).filter(([, value]) => typeof value === 'string')) as Record<
    string,
    string
  >;
}

function hasPortalPackageScript(scripts: Record<string, string>, name: string) {
  return Boolean(scripts[name]?.trim());
}

function appendDistBinCleanupCommand(script: string) {
  if (!script.trim() || script.includes(CLEAN_DIST_BIN_COMMAND)) {
    return script;
  }
  return `${script} && ${CLEAN_DIST_BIN_COMMAND}`;
}

async function ensurePortalBuildServerCleansDistBin(portalDir: string): Promise<void> {
  const packageJsonPath = path.join(portalDir, 'package.json');
  const content = await readFile(packageJsonPath, 'utf-8');
  const packageJson: unknown = JSON.parse(content);
  if (!packageJson || typeof packageJson !== 'object' || Array.isArray(packageJson)) {
    return;
  }

  const scripts = (packageJson as { scripts?: unknown }).scripts;
  if (!scripts || typeof scripts !== 'object' || Array.isArray(scripts)) {
    return;
  }

  const nextScripts = { ...scripts } as Record<string, unknown>;
  let changed = false;
  for (const scriptName of ['build:server', 'build:server:deps']) {
    const script = nextScripts[scriptName];
    if (typeof script !== 'string') {
      continue;
    }
    const nextScript = appendDistBinCleanupCommand(script);
    if (nextScript !== script) {
      nextScripts[scriptName] = nextScript;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  (packageJson as { scripts?: unknown }).scripts = nextScripts;
  await mkdir(path.join(portalDir, path.dirname(CLEAN_DIST_BIN_SCRIPT_PATH)), { recursive: true });
  await writeFile(path.join(portalDir, CLEAN_DIST_BIN_SCRIPT_PATH), CLEAN_DIST_BIN_SCRIPT, 'utf-8');
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8');
}

async function runPortalBuildCommands(params: {
  portalDir: string;
  apiBaseUrl: string;
  envApiUrl: string;
  portalBase: string;
  runCommand: RunCommand;
}) {
  const scripts = await readPortalPackageScripts(params.portalDir);
  const hasScript = (name: string) => hasPortalPackageScript(scripts, name);

  if (hasScript('build:client') && hasScript('build:server')) {
    if (hasScript('clean:dist')) {
      await runPnpmCommand(params.runCommand, ['clean:dist'], {
        cwd: params.portalDir,
        env: buildPortalCommandEnv(),
        envMode: 'replace',
        errorName: 'pnpm clean:dist',
      });
    }
    await runPnpmCommand(params.runCommand, ['build:client'], {
      cwd: params.portalDir,
      env: buildPortalCommandEnv({
        NOCOBASE_API_URL: params.apiBaseUrl,
        NOCOBASE_PORTAL_BASE: params.portalBase,
      }),
      envMode: 'replace',
      errorName: 'pnpm build:client',
    });
    if (hasScript('build:html')) {
      await runPnpmCommand(params.runCommand, ['build:html'], {
        cwd: params.portalDir,
        env: buildPortalCommandEnv({
          NOCOBASE_API_URL: params.envApiUrl,
          NOCOBASE_PORTAL_BASE: params.portalBase,
        }),
        envMode: 'replace',
        errorName: 'pnpm build:html',
      });
    }
    await runPnpmCommand(params.runCommand, ['build:server'], {
      cwd: params.portalDir,
      env: buildPortalCommandEnv({
        NOCOBASE_API_URL: params.apiBaseUrl,
        NOCOBASE_PORTAL_BASE: params.portalBase,
      }),
      envMode: 'replace',
      errorName: 'pnpm build:server',
    });
    return;
  }

  await runPnpmCommand(params.runCommand, ['build'], {
    cwd: params.portalDir,
    env: buildPortalCommandEnv({
      NOCOBASE_API_URL: params.apiBaseUrl,
      NOCOBASE_PORTAL_BASE: params.portalBase,
    }),
    envMode: 'replace',
    errorName: 'pnpm build',
  });
  if (Object.keys(scripts).length === 0 || hasScript('build:html')) {
    await runPnpmCommand(params.runCommand, ['build:html'], {
      cwd: params.portalDir,
      env: buildPortalCommandEnv({
        NOCOBASE_API_URL: params.envApiUrl,
        NOCOBASE_PORTAL_BASE: params.portalBase,
      }),
      envMode: 'replace',
      errorName: 'pnpm build:html',
    });
  }
}

async function packPortalDist(distDir: string): Promise<{ archivePath: string; cleanup: () => Promise<void> }> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-portal-dist-'));
  const archivePath = path.join(tempDir, 'dist.tar.gz');
  const entries = await readdir(distDir);
  await tar.create(
    {
      cwd: distDir,
      file: archivePath,
      gzip: true,
    },
    entries,
  );
  return {
    archivePath,
    cleanup: async () => {
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

async function uploadPortalDist(params: {
  archivePath: string;
  app: string;
  portal: string;
  portalBase: string;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<PortalDeployUploadResult> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      file: params.archivePath,
      app: params.app,
      portal: params.portal,
      basePath: params.portalBase,
    },
    operation: DEPLOY_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalDeployText(
        'errors.uploadFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal dist upload failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }

  return {
    distPath: readDistPathFromUploadResponse(response.data),
  };
}

async function syncMultiPortalRecord(params: {
  portal: string;
  envName?: string;
  cliVersion?: string;
  apiRequest?: ApiRequest;
}): Promise<void> {
  const apiRequest = params.apiRequest ?? executeApiRequest;
  const body: Record<string, unknown> = {
    uid: params.portal,
    title: titleFromPortalSlug(params.portal),
    portalType: 'ai',
    portalName: params.portal,
    routePath: `/${params.portal}`,
    authCheck: true,
    enabled: true,
    uiLayoutUid: DEFAULT_PORTAL_UI_LAYOUT_UID,
    skipCreatePortalDirectory: true,
  };
  const response = await apiRequest({
    cliVersion: params.cliVersion ?? '',
    envName: params.envName,
    flags: {
      filterKeys: ['portalName'],
      body: JSON.stringify(body),
    },
    operation: FIRST_OR_CREATE_PORTAL_OPERATION,
  });

  if (!response.ok) {
    throw new Error(
      portalDeployText(
        'errors.recordSyncFailed',
        { status: response.status, details: JSON.stringify(response.data, null, 2) },
        `Portal record sync failed with status ${response.status}\n${JSON.stringify(response.data, null, 2)}`,
      ),
    );
  }
}

export async function deployPortalWorkspace(options: PortalDeployOptions): Promise<PortalDeployResult> {
  const portal = validatePortalSlug(options.portal);
  const apiBaseUrl = trimValue(options.env.apiBaseUrl);
  const envApiUrl = resolvePortalEnvApiUrl(apiBaseUrl);
  const { app, appPublicPath, portalBaseApp } = await resolvePortalAppContext(options);
  const portalBase = buildPortalBasePath({ app: portalBaseApp ?? app, appPublicPath, portal });
  const deployBase = buildPortalBasePath({ app, appPublicPath, portal });
  const portalDir = resolveSavedPortalSourcePath(options.env, portal) ?? resolvePortalSourcePath(portal);
  const distDir = path.join(portalDir, PORTAL_DIST_DIR);
  const clientDistDir = path.join(portalDir, PORTAL_CLIENT_DIST_DIR);

  if (!(await pathExists(portalDir))) {
    throw new Error(
      portalDeployText(
        'errors.workspaceMissing',
        { portalDir, portal },
        `Portal does not exist: ${portalDir}\nRun \`nb portal create ${portal}\` first.`,
      ),
    );
  }
  await assertFileExists(
    path.join(portalDir, 'package.json'),
    portalDeployText(
      'errors.packageJsonMissing',
      { portalDir },
      `Portal is invalid: package.json is missing in ${portalDir}.`,
    ),
  );
  await updatePortalEnvFiles({
    portalDir,
    apiBaseUrl,
    portalBase,
  });
  await ensurePortalBuildHtmlReadsEnvOnly(portalDir);
  await ensurePortalBuildServerCleansDistBin(portalDir);

  const runCommand = options.runCommand ?? run;
  if (options.installDependencies !== false) {
    const installCommand = await resolvePnpmInstallCommand(portalDir);
    await runPnpmInstallCommand(runCommand, installCommand.args, {
      cwd: portalDir,
      env: buildPortalCommandEnv(),
      envMode: 'replace',
      errorName: installCommand.errorName,
    });
  }
  await runPortalBuildCommands({
    portalDir,
    apiBaseUrl,
    envApiUrl,
    portalBase,
    runCommand,
  });

  await assertFileExists(
    path.join(clientDistDir, 'index.html'),
    portalDeployText(
      'errors.distMissing',
      { distDir: clientDistDir },
      `Portal build did not produce ${path.join(clientDistDir, 'index.html')}.`,
    ),
  );
  await chmodPortalDistTree(distDir);

  if (options.env.kind !== 'local' && options.env.kind !== 'docker' && options.env.kind !== 'http') {
    throw new Error(
      portalDeployText(
        'errors.unsupportedEnvKind',
        { kind: options.env.kind },
        `Cannot deploy a portal for ${options.env.kind} envs in the first version.`,
      ),
    );
  }

  const archive = await packPortalDist(distDir);
  let uploadResult: PortalDeployUploadResult;
  try {
    uploadResult = await uploadPortalDist({
      archivePath: archive.archivePath,
      app,
      portal,
      portalBase: deployBase,
      envName: options.envName,
      cliVersion: options.cliVersion,
      apiRequest: options.apiRequest,
    });
  } finally {
    await archive.cleanup();
  }

  await syncMultiPortalRecord({
    portal,
    envName: options.envName,
    cliVersion: options.cliVersion,
    apiRequest: options.apiRequest,
  });

  return {
    app,
    portal,
    portalDir,
    portalBase,
    distDir,
    serverDistPath: uploadResult.distPath,
    mode: options.env.kind,
    uploaded: true,
    recordSynced: true,
  };
}
