/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr as _tExpr, useFlowEngine } from '@nocobase/flow-engine';
import { VSC_FILE_NAMESPACE } from '../../shared/vsc-file/constants';

export function useT() {
  const engine = useFlowEngine({ throwError: false });
  return (str: string) => engine?.context?.t?.(str, { ns: [VSC_FILE_NAMESPACE, 'client'] }) ?? str;
}

export function tExpr(key: string) {
  return _tExpr(key, { ns: [VSC_FILE_NAMESPACE, 'client'] });
}
