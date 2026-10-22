import { randomBytes } from 'node:crypto';

import type { DemoDataDependencies } from './service.js';
import { DEMO_CHAT_MODEL, DEMO_MODEL_SERVICE_TITLE } from './models.js';

interface ModelBinding {
  id: string;
  modelKey: string;
  modelService: string | null;
}

/** Environment infrastructure: provision at startup and retain across every dataset clear/reset. */
export class DemoModelRuntime {
  get available(): boolean {
    return Boolean(this.deps.agents?.()?.models?.services);
  }

  constructor(private readonly deps: DemoDataDependencies) {}

  private get enabled(): boolean {
    return this.deps.mode() !== 'off' && this.deps.settings.models;
  }

  private row(): Promise<ModelBinding | undefined> {
    return this.deps.database
      .query()
      .selectFrom('demoModeModel')
      .selectAll()
      .where('id', '=', 'default')
      .executeTakeFirst<ModelBinding>();
  }

  async load(): Promise<void> {
    const row = this.enabled ? await this.row() : undefined;
    this.deps.models.bind(
      row?.modelService ?? null,
      row?.modelService ? row.modelKey : null,
    );
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return this.load();
    const agents = this.deps.agents?.();
    const services = agents?.models?.services;
    if (!services) {
      if (agents)
        throw new Error(
          'Demo models require the Agents 1.0 model services (`agents.models.services`).',
        );
      return;
    }
    if (!(await this.row())) {
      try {
        await this.deps.database
          .query()
          .insertInto('demoModeModel')
          .values({ id: 'default', modelKey: randomBytes(24).toString('hex') })
          .execute();
      } catch (error) {
        if (!(await this.row())) throw error;
      }
    }
    let row = (await this.row())!;
    if (!row.modelService) {
      const created = await services.create({
        title: DEMO_MODEL_SERVICE_TITLE,
        provider: 'openai-compatible',
        baseUrl: this.deps.modelBaseUrl(),
        apiKey: row.modelKey,
        models: [{ value: DEMO_CHAT_MODEL, label: 'Demo chat' }],
      });
      const claimed = await this.deps.database
        .query()
        .updateTable('demoModeModel')
        .set({ modelService: created.name })
        .where('id', '=', 'default')
        .where('modelService', 'is', null)
        .execute();
      // Concurrent startups use the same durable winner and discard their extra registration.
      if (claimed.updatedCount !== 1) await services.remove(created.name);
      row = (await this.row())!;
    }
    const name = row.modelService!;
    await services.update(name, {
      baseUrl: this.deps.modelBaseUrl(),
      apiKey: row.modelKey,
      enabled: true,
      models: [{ value: DEMO_CHAT_MODEL, label: 'Demo chat' }],
    });
    await services.setDefaultChat(
      { modelService: name, model: DEMO_CHAT_MODEL },
      null,
    );
    await this.load();
  }
}
