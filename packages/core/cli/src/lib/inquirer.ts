/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import { cursorTo } from '@inquirer/ansi';
import pc from 'picocolors';
import {
  createPrompt,
  isBackspaceKey,
  isEnterKey,
  makeTheme,
  useEffect,
  useKeypress,
  usePrefix,
  useState,
} from '@inquirer/core';
type ConfirmModule = typeof import('@inquirer/confirm');
type SelectModule = typeof import('@inquirer/select');

type ConfirmOptions = {
  message: string;
  default?: boolean;
  transformer?: (value: boolean) => string;
  theme?: PartialDeep<Theme>;
};

type InputOptions = {
  message: string;
  default?: string;
  required?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme>;
  placeholder?: string;
};

type SelectChoice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
};

type SelectOptions<Value> = {
  message: string;
  choices: ReadonlyArray<Value | SelectChoice<Value>>;
  pageSize?: number;
  loop?: boolean;
  default?: Value;
  theme?: PartialDeep<Theme>;
};

type PasswordOptions = {
  message: string;
  mask?: boolean | string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  transformer?: (value: string) => string;
  theme?: PartialDeep<Theme>;
};

let confirmModulePromise: Promise<ConfirmModule> | undefined;
let selectModulePromise: Promise<SelectModule> | undefined;

function loadConfirmModule() {
  confirmModulePromise ??= import('@inquirer/confirm');
  return confirmModulePromise;
}

function loadSelectModule() {
  selectModulePromise ??= import('@inquirer/select');
  return selectModulePromise;
}

export function buildPlainMessageTheme(extra?: PartialDeep<Theme>): PartialDeep<Theme> {
  return {
    ...extra,
    style: {
      ...extra?.style,
      message: (text: string) => text,
    },
  };
}

function buildSelectAnswer(text: string) {
  return `\n${pc.cyan('❯')} ${pc.cyan(text)}`;
}

function buildConfirmAnswer(text: string) {
  return `\n${pc.cyan('❯')} ${pc.cyan(text)}`;
}

function isFullWidthCodePoint(codePoint: number) {
  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd))
  );
}

function stringWidth(value: string) {
  let width = 0;

  for (const char of value) {
    const codePoint = char.codePointAt(0);

    if (codePoint == null) continue;
    if (codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)) continue;

    width += isFullWidthCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function stripAnsi(value: string) {
  return value.replace(new RegExp(String.raw`\\u001B\\[[0-9;]*m`, 'g'), '');
}

function lastLineWidth(value: string) {
  const lines = stripAnsi(value).split('\n');
  return stringWidth(lines[lines.length - 1] ?? '');
}

function resolveRequiredError(required: boolean | string | undefined) {
  if (typeof required === 'string') {
    return required;
  }

  return '此项为必填';
}

function hasUsableDefault(value: string | undefined): value is string {
  return value != null && value !== '';
}

function buildIdleHint(config: InputOptions) {
  const placeholder = config.placeholder?.trim();
  if (placeholder) {
    return placeholder;
  }
  return '';
}

function buildInputLine(value: string) {
  return `${pc.cyan('❯')} ${value}`;
}

function buildErrorLine(error: string) {
  return pc.red(`✖ ${error}`);
}

export const input = createPrompt<string, InputOptions>((config, done) => {
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState<'idle' | 'done' | 'loading'>('idle');
  const [defaultValue, setDefaultValue] = useState(config.default ?? '');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const prefix = usePrefix({ status, theme });

  useEffect((rl) => {
    if (config.default) {
      rl.write(config.default);
      setValue(config.default);
    }
  }, [config.default]);

  useKeypress(async (key, rl) => {
    if (status !== 'idle') return;

    if (isBackspaceKey(key) && !value) {
      setDefaultValue('');
      return;
    }

    if (isBackspaceKey(key)) {
      setValue(rl.line.slice(0, -1));
      setError(undefined);
      return;
    }

    if (!isEnterKey(key)) {
      setValue(rl.line);
      setError(undefined);
      return;
    }

    const answer = value || defaultValue;

    setStatus('loading');

    if (!answer && config.required) {
      rl.write(value);
      setError(resolveRequiredError(config.required));
      setStatus('idle');
      return;
    }

    if (config.validate) {
      const result = await config.validate(answer);
      if (result !== true) {
        rl.write(value);
        setError(typeof result === 'string' ? result : 'Invalid input');
        setStatus('idle');
        return;
      }
    }

    setValue(answer);
    setStatus('done');
    done(answer);
  });

  const message = theme.style.message(config.message, status);
  const isTyping = value.length > 0;
  const hasDefault = hasUsableDefault(defaultValue);
  const idleHint = buildIdleHint(config);
  const showIdleHint = !isTyping && status === 'idle' && idleHint !== '';
  const showDefaultValue = !isTyping && status === 'idle' && hasDefault;

  const displayValue =
    status === 'done'
      ? theme.style.answer(value)
      : isTyping
        ? value
        : showDefaultValue
          ? defaultValue
          : showIdleHint
            ? pc.dim(idleHint)
            : '';

  const headerLine = [prefix, message].filter(Boolean).join(' ');
  const inputLine = buildInputLine(displayValue);
  const prompt = headerLine.endsWith('\n') ? `${headerLine}${inputLine}` : `${headerLine}\n${inputLine}`;

  const promptWithCursorFix =
    showIdleHint
      ? prompt + cursorTo(lastLineWidth(buildInputLine('')))
      : showDefaultValue
        ? prompt + cursorTo(lastLineWidth(buildInputLine(defaultValue)))
        : prompt;

  return [promptWithCursorFix, error ? buildErrorLine(error) : ''];
});

export async function confirm(options: ConfirmOptions): Promise<boolean> {
  const module = await loadConfirmModule();
  return module.default({
    ...options,
    theme: buildPlainMessageTheme({
      style: {
        answer: buildConfirmAnswer,
      },
      ...options.theme,
    }),
    transformer: options.transformer ?? ((value) => (value ? 'Yes' : 'No')),
  });
}

export async function select<Value>(options: SelectOptions<Value>): Promise<Value> {
  const module = await loadSelectModule();
  return module.default({
    ...options,
    theme: buildPlainMessageTheme({
      style: {
        answer: buildSelectAnswer,
      },
      ...options.theme,
    }),
  });
}

function resolveMaskChar(mask: boolean | string | undefined) {
  if (typeof mask === 'string') {
    return mask;
  }

  if (mask === false) {
    return '';
  }

  return '•';
}

export const password = createPrompt<string, PasswordOptions>((config, done) => {
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState<'idle' | 'done' | 'loading'>('idle');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const prefix = usePrefix({ status, theme });

  useKeypress(async (key, rl) => {
    if (status !== 'idle') return;

    if (!isEnterKey(key)) {
      setValue(rl.line);
      setError(undefined);
      return;
    }

    const answer = value;
    setStatus('loading');

    if (config.validate) {
      const result = await config.validate(answer);
      if (result !== true) {
        rl.write(value);
        setError(typeof result === 'string' ? result : 'Invalid input');
        setStatus('idle');
        return;
      }
    }

    setValue(answer);
    setStatus('done');
    done(answer);
  });

  const message = theme.style.message(config.message, status);
  const maskChar = resolveMaskChar(config.mask);
  const transformedValue = value ? config.transformer?.(value) : undefined;
  const displayValue =
    status === 'done'
      ? theme.style.answer(transformedValue ?? maskChar.repeat(value.length))
      : transformedValue ?? (maskChar ? maskChar.repeat(value.length) : '');

  const headerLine = [prefix, message].filter(Boolean).join(' ');
  const inputLine = buildInputLine(displayValue);
  const prompt = headerLine.endsWith('\n') ? `${headerLine}${inputLine}` : `${headerLine}\n${inputLine}`;

  return [prompt, error ? buildErrorLine(error) : ''];
});
