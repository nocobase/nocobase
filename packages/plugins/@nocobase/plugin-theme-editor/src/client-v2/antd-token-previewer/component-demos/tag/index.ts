/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import closable from './closable';
import error from './error';
import info from './info';
import multiTags from './multiTags';
import success from './success';
import Default from './tag';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, error, info, success, warning, multiTags, closable];

export default previewerDemo;
