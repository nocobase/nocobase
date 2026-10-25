import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderContext } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';
import type { KnowledgeClientOptions } from '../plugin.js';
import { registerBuiltinIndexingForms } from './builtins.js';
import { knowledgeIndexingFormsToken } from './context.js';
import { createIndexingFormRegistryOwner } from './registry.js';

export class KnowledgeIndexingFormsProvider extends ServiceProvider<ClientApplication> {
  public readonly name = '@nocobase/app-plugin-knowledge/indexing-forms';
  private readonly owner = createIndexingFormRegistryOwner();
  public constructor(
    app: ClientApplication,
    private readonly context: ClientServiceProviderContext<KnowledgeClientOptions>,
  ) {
    super(app);
  }
  public override register(): void {
    this.app.container.singleton(
      knowledgeIndexingFormsToken,
      () => this.owner.registry,
    );
  }
  public override boot(): Promise<void> {
    registerBuiltinIndexingForms(this.owner.registry);
    for (const definition of this.context.options.indexingForms ?? [])
      this.owner.registry.register(definition);
    return Promise.resolve();
  }
  public override start(): Promise<void> {
    this.owner.registry.seal();
    return Promise.resolve();
  }
  public override shutdown(): Promise<void> {
    this.owner.dispose();
    return Promise.resolve();
  }
}
