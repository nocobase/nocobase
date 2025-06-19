/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function getInstanceId() {
  const dir = path.resolve(process.cwd(), 'storage/.license');
  const filePath = path.resolve(dir, 'instance-id');
  await createInstanceId(true);
  // if (!fs.existsSync(filePath)) {
  //   await createInstanceId(true);
  // }
  const id = fs.readFileSync(filePath, 'utf-8');
  return id;
}

export async function createInstanceId(force = false) {
  return new Promise((resolve, reject) => {
    exec(`yarn nocobase generate-instance-id ${force ? '--force' : ''}`, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(stdout);
    });
  });
}

export async function saveLicenseKey(licenseKey: string) {
  const dir = path.resolve(process.cwd(), 'storage/.license');
  const filePath = path.resolve(dir, 'license-key');
  fs.writeFileSync(filePath, licenseKey);
}

export async function isLicenseKeyExists() {
  const dir = path.resolve(process.cwd(), 'storage/.license');
  const filePath = path.resolve(dir, 'license-key');
  return fs.existsSync(filePath);
}
