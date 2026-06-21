/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginAIServer from '../plugin';
import type { AIEmployee } from '../../collections/ai-employees';
import _ from 'lodash';
import { Context } from '@nocobase/actions';
// @ts-ignore
import pkg from '../../../package.json';

export class BuiltInManager {
  constructor(protected plugin: PluginAIServer) {}

  setupBuiltInInfo(ctx: Context, aiEmployee: AIEmployee) {
    if (!aiEmployee) {
      return;
    }
    if (!aiEmployee.builtIn) {
      return;
    }
    aiEmployee.nickname = ctx.t?.(aiEmployee.nickname, { ns: pkg.name });
    aiEmployee.position = ctx.t?.(aiEmployee.position, { ns: pkg.name });
    aiEmployee.bio = ctx.t?.(aiEmployee.bio, { ns: pkg.name });
    aiEmployee.greeting = ctx.t?.(aiEmployee.greeting, { ns: pkg.name });
  }
}
