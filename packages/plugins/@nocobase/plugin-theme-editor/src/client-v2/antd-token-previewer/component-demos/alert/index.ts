/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Default from './alert';
import error from './error';
import info from './info';
import success from './success';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, error, info, success, warning];

export default previewerDemo;
