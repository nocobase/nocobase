/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import clearIcon from './clearIcon';
import danger from './danger';
import disabled from './disabled';
import Default from './input';
import warning from './warning';
import withAddon from './withAddon';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, clearIcon, danger, warning, withAddon, disabled];

export default previewerDemo;
