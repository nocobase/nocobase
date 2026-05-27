/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import danger from './danger';
import success from './success';
import Default from './timeline';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, danger, success];

export default previewerDemo;
