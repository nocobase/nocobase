/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

declare module 'picocolors' {
  const pc: {
    bold(value: string): string;
    createColors(enabled?: boolean): {
      red(value: string): string;
    };
    cyan(value: string): string;
    dim(value: string): string;
    green(value: string): string;
    isColorSupported: boolean;
    yellow(value: string): string;
    red(value: string): string;
  };

  export default pc;
}

declare module 'ora' {
  export interface Ora {
    text: string;
    start(): Ora;
    stop(): Ora;
    succeed(text?: string): Ora;
    fail(text?: string): Ora;
    warn(text?: string): Ora;
    info(text?: string): Ora;
  }

  export interface OraOptions {
    text?: string;
    isSilent?: boolean;
  }

  export default function ora(options?: OraOptions): Ora;
}
