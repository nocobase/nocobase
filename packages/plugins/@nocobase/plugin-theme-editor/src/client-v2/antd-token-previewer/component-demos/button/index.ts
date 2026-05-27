/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Default from './button';
import ButtonIconDemo from './button-icon';
import DangerButton from './dangerButton';
import DefaultButton from './defaultButton';
import disabled from './disabled';

import type { ComponentDemo } from '../../interface';

const previewerDemo: ComponentDemo[] = [Default, ButtonIconDemo, DangerButton, DefaultButton, disabled];

export default previewerDemo;
