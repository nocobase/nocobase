import type { MailTemplate } from '../mail-client.js';
import type { MailTemplateVariables } from '../contracts/composer.js';

export type { MailTemplateVariables } from '../contracts/composer.js';

export interface RenderedMailTemplate {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

const TEMPLATE_VARIABLE =
  /\{\{\s*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\.\d+)*)\s*\}\}/gu;
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'FONT',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'IMG',
  'I',
  'LI',
  'OL',
  'P',
  'S',
  'SPAN',
  'STRONG',
  'U',
  'UL',
]);

export function renderMailTemplate(
  template: Pick<MailTemplate, 'subject' | 'text' | 'html'>,
  variables: MailTemplateVariables = {},
): RenderedMailTemplate {
  const subject = interpolateMailTemplate(template.subject, variables);
  const text = interpolateMailTemplate(template.text ?? '', variables);
  const html = sanitizeMailHtml(
    interpolateMailTemplate(template.html, variables, escapeHtml),
  );
  return {
    subject,
    text: text || htmlToPlainText(html),
    html: html || plainTextToMailHtml(text),
  };
}

export function interpolateMailTemplate(
  source: string,
  variables: MailTemplateVariables,
  encode: (value: string) => string = (value) => value,
): string {
  return source.replace(TEMPLATE_VARIABLE, (placeholder, path: string) => {
    const value = resolveTemplateValue(variables, path);
    return value === undefined ? placeholder : encode(stringifyValue(value));
  });
}

export function plainTextToMailHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/\n{2,}/u)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`,
    )
    .join('');
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = sanitizeMailHtml(html);
  for (const element of container.querySelectorAll('br')) {
    element.replaceWith('\n');
  }
  for (const element of container.querySelectorAll('p, div, li, blockquote')) {
    element.append('\n');
  }
  return (container.textContent ?? '').replace(/\n{3,}/gu, '\n\n').trimEnd();
}

export function sanitizeMailHtml(html: string): string {
  if (!html) return '';
  const container = document.createElement('div');
  container.innerHTML = html;
  sanitizeChildren(container);
  return container.innerHTML;
}

function sanitizeChildren(parent: Element): void {
  for (const child of [...parent.children]) {
    if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') {
      child.remove();
      continue;
    }
    if (!ALLOWED_TAGS.has(child.tagName)) {
      sanitizeChildren(child);
      child.replaceWith(...child.childNodes);
      continue;
    }
    // Retain only bounded pixel font sizes, never arbitrary pasted CSS.
    const style = document.createElement('span').style;
    style.cssText = child.getAttribute('style') ?? '';
    const pixelFontSize = style.fontSize;
    child.removeAttribute('style');
    for (const attribute of [...child.attributes]) {
      const allowed =
        child.tagName === 'A' &&
        ['href', 'rel', 'target', 'title'].includes(attribute.name);
      const fontSize =
        child.tagName === 'FONT' &&
        attribute.name === 'size' &&
        /^[1-7]$/u.test(attribute.value);
      const imageAttribute =
        child.tagName === 'IMG' &&
        (['alt', 'title', 'src'].includes(attribute.name) ||
          (['width', 'height'].includes(attribute.name) &&
            /^[1-9]\d{0,4}$/u.test(attribute.value) &&
            Number(attribute.value) <= 10000));
      const signatureClass =
        child.tagName === 'DIV' &&
        attribute.name === 'class' &&
        attribute.value === 'nocobase-mail-signature';
      if (!allowed && !fontSize && !imageAttribute && !signatureClass)
        child.removeAttribute(attribute.name);
    }
    if (/^(?:10|12|14|16|18|24|32|48)px$/u.test(pixelFontSize)) {
      child.setAttribute('style', `font-size: ${pixelFontSize};`);
    }
    // Keep imported legacy 48px text distinct from the editor's temporary marker.
    if (child.tagName === 'FONT' && child.getAttribute('size') === '7') {
      if (!child.hasAttribute('style')) {
        child.setAttribute('style', 'font-size: 48px;');
      }
      child.removeAttribute('size');
    }
    if (child.tagName === 'A') {
      const href = child.getAttribute('href');
      if (href && !isSafeLink(href)) child.removeAttribute('href');
      if (child.getAttribute('target') === '_blank') {
        child.setAttribute('rel', 'noopener noreferrer');
      } else {
        child.removeAttribute('target');
        child.removeAttribute('rel');
      }
    }
    if (child.tagName === 'IMG') {
      const src = child.getAttribute('src');
      if (!src || !isSafeImageSource(src)) child.removeAttribute('src');
    }
    sanitizeChildren(child);
  }
}

function resolveTemplateValue(
  variables: MailTemplateVariables,
  path: string,
): unknown {
  let value: unknown = variables;
  for (const segment of path.split('.')) {
    if (UNSAFE_PATH_SEGMENTS.has(segment)) return undefined;
    if (Array.isArray(value) && /^\d+$/u.test(segment)) {
      value = value[Number(segment)];
      continue;
    }
    if (!isRecord(value) || !Object.hasOwn(value, segment)) return undefined;
    value = value[segment];
  }
  return value;
}

function stringifyValue(value: unknown): string {
  if (value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'symbol') return value.description ?? '';
  if (typeof value === 'function') return '';
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isSafeLink(href: string): boolean {
  return /^(?:https?:|mailto:|tel:|#)/iu.test(href.trim());
}

function isSafeImageSource(src: string): boolean {
  return /^(?:https?:|cid:|\/(?!\/)|data:image\/(?:gif|jpe?g|png|webp);base64,)/iu.test(
    src.trim(),
  );
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
