import { ButtonProps } from 'antd';
import { Application } from '../Application';
import { SchemaInitializer } from './SchemaInitializer';

export class SchemaInitializerManager {
  protected schemaInitializers: Record<string, SchemaInitializer<any, any>> = {};

  constructor(
    protected _schemaInitializers: SchemaInitializer<any, any>[] = [],
    protected app: Application,
  ) {
    this.app = app;

    _schemaInitializers.forEach((item) => this.add(item));
  }

  add<P1 = any, P2 = any>(schemaInitializer: SchemaInitializer<P1, P2>) {
    this.schemaInitializers[schemaInitializer.name] = schemaInitializer;
  }

  get<P1 = ButtonProps, P2 = {}>(name: string): SchemaInitializer<P1, P2> | undefined {
    return this.schemaInitializers[name];
  }

  getAll() {
    return this.schemaInitializers;
  }

  has(name: string) {
    return !!this.get(name);
  }

  remove(name: string) {
    delete this.schemaInitializers[name];
  }
}
