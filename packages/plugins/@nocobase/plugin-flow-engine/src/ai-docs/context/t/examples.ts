/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export function translateInModel(ctx: FlowCtx) {
  return ctx.t('greeting', { ns: 'common', name: 'NocoBase' });
}

export function translateInStep(ctx: FlowCtx) {
  return ctx.t('workflow.done', { ns: 'flow', count: 3 });
}

export function translateInPlugin(appCtx: { t: FlowCtx['t'] }) {
  return appCtx.t('plugin.loaded', { ns: 'system' });
}
