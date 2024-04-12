/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial and under the AGPL license.
 * For more information, see <https://www.nocobase.com/agreement>
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.
 */

import fg from 'fast-glob';
import fs from 'fs-extra';
import { PkgLog } from './utils';

const commercialLicense = `
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */
`.trim()
const openSourceLicense = `
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial and under the AGPL license.
 * For more information, see <https://www.nocobase.com/agreement>
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/agpl-3.0.html>.
 */
`.trim()

function getLicenseText(packageDir: string) {
  return packageDir.includes('/pro-plugins') ? commercialLicense : openSourceLicense;
}

function addLicenseToFile(filePath: string | Buffer, licenseText: string) {
  const data = fs.readFileSync(filePath, 'utf8');

  // 添加授权信息到文件内容的顶部
  const newData = licenseText + '\n\n' + data;

  // 将修改后的内容写回文件
  fs.writeFileSync(filePath, newData, 'utf8');
}

export async function addLicense(cwd: string, log: PkgLog) {
  const stream = fg.globStream('**/*.{js,jsx,ts,tsx,d.ts}', { cwd, ignore: ['node_modules'], absolute: true, onlyFiles: true });

  const licenseText = getLicenseText(cwd);
  for await (const filePath of stream) {
    addLicenseToFile(filePath, licenseText);
  }
}
