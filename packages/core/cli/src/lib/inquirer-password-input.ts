/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import pc from 'picocolors';
import {
  createPrompt,
  isEnterKey,
  makeTheme,
  useKeypress,
  usePrefix,
  useState,
} from '@inquirer/core';
import type { Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

export type PasswordInputConfig = {
  message: string;
  mask?: boolean | string;
  validate?: (value: string) => boolean | string | Promise<boolean | string>;
  theme?: PartialDeep<Theme>;
};

function buildInputLine(maskedValue: string) {
  return `${pc.cyan('❯')} ${maskedValue}`;
}

function buildErrorLine(error: string) {
  return pc.red(`✖ ${error}`);
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

export const passwordInput = createPrompt<string, PasswordInputConfig>((config, done) => {
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
  const displayValue =
    status === 'done'
      ? theme.style.answer(maskChar.repeat(value.length))
      : maskChar
        ? maskChar.repeat(value.length)
        : '';

  const headerLine = [prefix, message].filter(Boolean).join(' ');
  const inputLine = buildInputLine(displayValue);
  const prompt = headerLine.endsWith('\n') ? `${headerLine}${inputLine}` : `${headerLine}\n${inputLine}`;

  return [prompt, error ? buildErrorLine(error) : ''];
});
