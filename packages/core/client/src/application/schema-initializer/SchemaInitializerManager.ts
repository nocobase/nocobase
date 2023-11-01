import { ButtonProps } from 'antd';
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
}
