/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import danger from './danger';
import disabled from './disabled';
import icon from './icon';
import Default from './select';
import SelectTag from './selectTag';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, SelectTag, danger, warning, icon, disabled];

export default previewerDemo;
