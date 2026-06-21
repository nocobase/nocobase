/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type DocInfoMode = 'simple' | 'full';

export function formatDocInfo(
  doc: any,
  options?: {
    /**
     * - `simple`: description + examples
     * - `full`: description + params/returns/ref/disabled + examples
     */
    mode?: DocInfoMode;
  },
): string {
  const mode: DocInfoMode = options?.mode || 'full';

  if (typeof doc === 'string') return doc;
  if (!doc || typeof doc !== 'object') return String(doc ?? '');

  if (mode === 'simple') {
    const description = doc.description ?? doc.detail ?? doc.type ?? '';
    const examples = Array.isArray(doc.examples)
      ? doc.examples.filter((x: any) => typeof x === 'string' && x.trim())
      : [];
    if (!examples.length) return typeof description === 'string' ? description : String(description ?? '');
    return [description, 'Examples:', ...examples].filter(Boolean).join('\n');
  }

  const description = doc.description ?? doc.detail ?? doc.type ?? '';
  const params = Array.isArray(doc.params) ? doc.params : [];
  const returns = doc.returns;
  const ref = doc.ref;
  const disabled = doc.disabled;
  const disabledReason = doc.disabledReason;

  const formatRef = (v: any): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const url = typeof v.url === 'string' ? v.url : '';
      const title = typeof v.title === 'string' ? v.title : '';
      if (title && url) return `${title}: ${url}`;
      return url || title;
    }
    return String(v);
  };

  const formatParam = (p: any): string => {
    if (!p || typeof p !== 'object') return '';
    const name = typeof p.name === 'string' ? p.name : '';
    if (!name) return '';
    const type = typeof p.type === 'string' ? p.type : '';
    const optional = p.optional ? '?' : '';
    const def =
      typeof p.default === 'undefined'
        ? ''
        : ` = ${typeof p.default === 'string' ? JSON.stringify(p.default) : String(p.default)}`;
    const desc = typeof p.description === 'string' ? p.description : '';
    const sig = `${name}${optional}${type ? `: ${type}` : ''}${def}`;
    return desc ? `${sig} - ${desc}` : sig;
  };

  const formatReturn = (r: any): string => {
    if (!r || typeof r !== 'object') return '';
    const type = typeof r.type === 'string' ? r.type : '';
    const desc = typeof r.description === 'string' ? r.description : '';
    if (type && desc) return `${type} - ${desc}`;
    return type || desc;
  };

  const examples = Array.isArray(doc.examples)
    ? doc.examples.filter((x: any) => typeof x === 'string' && x.trim())
    : [];
  const lines: string[] = [];
  if (typeof description === 'string' && description.trim()) lines.push(description);
  if (params.length) {
    const ps = params.map(formatParam).filter(Boolean);
    if (ps.length) lines.push('Params:', ...ps.map((x) => `- ${x}`));
  }
  const ret = formatReturn(returns);
  if (ret) lines.push('Returns:', `- ${ret}`);
  const refText = formatRef(ref);
  if (refText) lines.push('Ref:', `- ${refText}`);
  if (disabled) {
    const reason = typeof disabledReason === 'string' ? disabledReason : '';
    lines.push('Disabled:', `- ${reason || 'true'}`);
  }
  if (examples.length) lines.push('Examples:', ...examples);
  if (!lines.length) return '';
  return lines.join('\n');
}
