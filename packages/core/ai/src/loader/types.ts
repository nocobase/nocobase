/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIManager } from '../ai-manager';

export abstract class LoadAndRegister<TOptions> {
  constructor(
    protected readonly ai: AIManager,
    protected readonly options: TOptions,
  ) {}
  protected abstract scan(): Promise<void>;
  protected abstract import(): Promise<void>;
  protected abstract register(): Promise<void>;
  async load(): Promise<void> {
    await this.scan();
    await this.import();
    await this.register();
  }
}
