/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const CHARSET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Generate a random base36 identifier with an optional semantic prefix.
 *
 * Equivalent in shape to v1's `uid()` from `@formily/shared` (11 chars
 * of `[0-9a-z]`), with an opt-in prefix appended at the front. v2 forbids
 * direct `@formily/*` imports in `src/client-v2/`, so this helper is the
 * single substitute the rest of the codebase should reach for.
 *
 * Common semantic prefixes observed across the codebase — pass the one
 * that matches your domain rather than relying on a default, so the
 * intent is explicit at the call site:
 *
 *   - `s_` — service / settings record (authenticators, channels, …)
 *   - `v_` — verifier / variable / LLM service
 *   - `f_` — field
 *   - `t_` — through table
 *
 * Example:
 *
 * ```ts
 * import { randomId } from '@nocobase/flow-engine';
 *
 * name: randomId('s_'),  // → 's_keeoaui1ubi'
 * name: randomId('v_'),  // → 'v_a8f3kp2x9qm'
 * name: randomId(),      // → 'a8f3kp2x9qm'
 * ```
 *
 * Not cryptographically secure — uses `Math.random()`. Good enough for
 * unique form names / schema keys, NOT for security tokens.
 */
export function randomId(prefix = '', length = 11): string {
  let id = '';
  for (let i = 0; i < length; i++) {
    id += CHARSET[(Math.random() * CHARSET.length) | 0];
  }
  return `${prefix}${id}`;
}
