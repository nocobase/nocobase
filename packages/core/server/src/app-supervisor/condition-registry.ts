/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type Predicate<C> = (ctx: C) => boolean | Promise<boolean>;
type Handler<C, R> = (ctx: C) => R | Promise<R>;

interface Rule<C, R> {
  when: Predicate<C>;
  run: Handler<C, R>;
  priority?: number;
}

export class ConditionalRegistry<C, R> {
  private rules: Rule<C, R>[] = [];
  private defaultHandler?: Handler<C, R>;

  register(when: Predicate<C>, run: Handler<C, R>, priority = 0) {
    this.rules.push({ when, run, priority });
    this.rules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  setDefault(run: Handler<C, R>) {
    this.defaultHandler = run;
  }

  async run(ctx: C): Promise<R> {
    for (const rule of this.rules) {
      if (await rule.when(ctx)) {
        return await rule.run(ctx);
      }
    }

    if (this.defaultHandler) {
      return await this.defaultHandler(ctx);
    }

    throw new Error('No handler matched and no default handler defined');
  }
}
