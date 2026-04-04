/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import os from 'node:os';
import path from 'node:path';
import {promises as fs} from 'node:fs';

export interface AuthProfile {
  baseUrl?: string;
  auth?: {
    type: 'token' | 'oauth';
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface AuthConfig {
  profiles: Record<string, AuthProfile>;
}

const DEFAULT_CONFIG: AuthConfig = {
  profiles: {},
};

function getConfigFile() {
  return path.join(os.homedir(), '.nocobase-cli', 'config.json');
}

export async function loadAuthConfig(): Promise<AuthConfig> {
  const filePath = getConfigFile();

  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as AuthConfig;
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

export async function saveAuthConfig(config: AuthConfig) {
  const filePath = getConfigFile();
  await fs.mkdir(path.dirname(filePath), {recursive: true});
  await fs.writeFile(filePath, JSON.stringify(config, null, 2));
}

export async function upsertTokenProfile(profileName: string, baseUrl: string, accessToken: string) {
  const config = await loadAuthConfig();
  config.profiles[profileName] = {
    baseUrl,
    auth: {
      type: 'token',
      accessToken,
    },
  };
  await saveAuthConfig(config);
}

export async function clearProfile(profileName: string) {
  const config = await loadAuthConfig();
  delete config.profiles[profileName];
  await saveAuthConfig(config);
}

export async function getProfile(profileName: string) {
  const config = await loadAuthConfig();
  return config.profiles[profileName];
}
