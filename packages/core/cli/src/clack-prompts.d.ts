/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare module '@clack/prompts' {
  export function intro(title?: string): void;
  export function outro(message?: string): void;
  export function cancel(message?: string): void;
  export function isCancel(value: unknown): value is symbol;
  export function confirm(options: {
    message: string;
    active?: string;
    inactive?: string;
    initialValue?: boolean;
  }): Promise<boolean | symbol>;
  export function text(options: {
    message: string;
    placeholder?: string;
    defaultValue?: string;
    initialValue?: string;
    validate?: (value: string) => string | Error | undefined;
  }): Promise<string | symbol>;
  export function password(options: {
    message: string;
    mask?: string;
    validate?: (value: string) => string | Error | undefined;
  }): Promise<string | symbol>;
  export function select<Value>(options: {
    message: string;
    options: Array<{
      value: Value;
      label?: string;
      hint?: string;
    }>;
    initialValue?: Value;
    maxItems?: number;
  }): Promise<symbol | Value>;
  export const log: {
    message: (message?: string, opts?: { symbol?: string }) => void;
    info: (message: string) => void;
    success: (message: string) => void;
    step: (message: string) => void;
    warn: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
  };
}
