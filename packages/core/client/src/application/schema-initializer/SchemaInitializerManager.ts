import { ButtonProps, ListProps } from 'antd';
import { Application } from '../Application';
import { SchemaInitializer } from './SchemaInitializer';
import { SchemaInitializerOptions } from './types';

export class SchemaInitializerManager {
  constructor(
    protected initializers: Record<string, SchemaInitializer<any, any>> = {},
    protected app: Application,
  ) {
    this.app = app;
  }

  add<P1 = any, P2 = any>(schemaInitializer: SchemaInitializer<P1, P2>) {
    this.initializers[schemaInitializer.name] = schemaInitializer;
  }

  get<P1 = ButtonProps, P2 = {}>(name: string): SchemaInitializer<P1, P2> | undefined {
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

  render<P1 = ButtonProps, P2 = {}>(name: string, options?: SchemaInitializerOptions<P1, P2>) {
    if (!name) return null;
    const initializer = this.get<P1, P2>(name);
    if (!initializer) {
      console.error(`[nocobase]: SchemaInitializer "${name}" not found`);
      return null;
    }
    return initializer.render(options);
  }

  getRender<P1 = ButtonProps, P2 = {}>(name: string, options?: SchemaInitializerOptions<P1, P2>) {
    if (!name) {
      return {
        exists: false,
        render: () => null,
      };
    }

    const initializer = this.get<P1, P2>(name);
    if (!initializer) {
      console.error(`[nocobase]: SchemaInitializer "${name}" not found`);
      return {
        exists: false,
        render: () => null,
      };
    }
    return {
      exists: true,
      render: initializer.getRender(options),
    };
  }
}
