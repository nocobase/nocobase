/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';

export class PluginAIClientV2 extends Plugin {}

export default PluginAIClientV2;

export { AIEmployeeProfileCard } from './ai-employees/ProfileCard';
export { AIEmployeeShortcut } from './ai-employees/AIEmployeeShortcut';
export type { AIEmployee, Task } from './ai-employees/types';
export { avatars, avatarsMap } from '../shared/ai-employees/avatars';
