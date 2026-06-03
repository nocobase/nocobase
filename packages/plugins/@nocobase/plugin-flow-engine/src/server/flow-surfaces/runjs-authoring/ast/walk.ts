/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as acornWalk from 'acorn-walk';
import { ACORN_WALK_BASE } from './parser';

export function walkAstSimple(ast: any, visitors: Record<string, (...args: any[]) => void>) {
  (acornWalk as any).simple(ast, visitors, ACORN_WALK_BASE);
}

export function walkAstAncestor(ast: any, visitors: Record<string, (...args: any[]) => void>) {
  (acornWalk as any).ancestor(ast, visitors, ACORN_WALK_BASE);
}
