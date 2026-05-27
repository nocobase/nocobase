/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Heading4 from './Heading4';
import error from './error';
import success from './success';
import TypographyDemo from './typography';
import warning from './warning';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [TypographyDemo, Heading4, error, warning, success];

export default previewerDemo;
