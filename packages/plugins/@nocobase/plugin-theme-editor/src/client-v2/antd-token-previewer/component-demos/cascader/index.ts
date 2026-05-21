/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Default from './cascader';
import disable from './disable';
import HighLight from './highlight';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, HighLight, disable];

export default previewerDemo;
