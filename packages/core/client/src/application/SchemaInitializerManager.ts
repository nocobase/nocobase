import { Application } from './Application';
import { SchemaInitializerV2 } from './SchemaInitializer';
import { SchemaInitializerButtonProps } from '../schema-initializer';

export class SchemaInitializerManager {
  constructor(
    protected initializers: Record<string, SchemaInitializerV2> = {},
    protected app: Application,
  ) {
    this.app = app;
  }

  add(name: string, schemaInitializer: SchemaInitializerV2) {
    this.initializers[name] = schemaInitializer;
  }

  get(name: string): SchemaInitializerV2 | undefined {
    return this.initializers[name];
  }

  getAll() {
    return this.initializers;
  }

  has(name: string) {
    return !!this.get(name);
  }

  remove(name: string) {
    delete this.initializers[name];
  }

  render(name: string, options?: SchemaInitializerButtonProps) {
    const initializer = this.get(name);
    if (!initializer) throw new Error(`[nocobase]: Schema initializer ${name} not found`);
    return initializer.render(options);
  }

  getRender(name: string, options?: SchemaInitializerButtonProps) {
    const initializer = this.get(name);
    if (!initializer) throw new Error(`[nocobase]: Schema initializer ${name} not found`);
    return initializer.getRender(options);
  }
}
