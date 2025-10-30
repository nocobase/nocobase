/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Lightweight JSX -> JS compiler for RunJS user code.
 * - Uses sucrase via dynamic import (lazy; avoids static cycles and cost when not needed)
 * - Maps JSX to ctx.React.createElement / ctx.React.Fragment so no global React is required
 * - If sucrase is unavailable or transform throws, returns original code as graceful fallback
 */
export async function compileRunJs(code: string): Promise<string> {
  // Fast path: cheap heuristic to skip import if no JSX likely present
  // (not strict; still safe because we fall back to transform if dynamic import is cheap)
  const maybeJSX = /<[A-Za-z]|<\//.test(code);
  if (!maybeJSX) return code;

  try {
    const mod: any = await import('sucrase');
    const transform = mod?.transform || mod?.default?.transform;
    if (typeof transform !== 'function') return code;
    const res = transform(code, {
      transforms: ['jsx'],
      jsxPragma: 'ctx.React.createElement',
      jsxFragmentPragma: 'ctx.React.Fragment',
      // Keep ES syntax as-is; JSRunner runs in modern engines
      disableESTransforms: true,
      production: true,
    });
    return (res && (res.code || res?.output)) ?? code;
  } catch (_e) {
    // Fallback: return original code if transform fails
    return code;
  }
}
