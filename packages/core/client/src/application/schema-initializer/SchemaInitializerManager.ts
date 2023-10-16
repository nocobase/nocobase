import { ButtonProps, ListProps } from 'antd';
import { ListItemProps } from 'antd/es/list';
import { Application } from '../Application';
import { SchemaInitializerV2 } from './SchemaInitializer';
import { SchemaInitializerOptions } from './types';

export class SchemaInitializerManager {
  constructor(
    protected initializers: Record<string, SchemaInitializerV2<any, any>> = {},
    protected app: Application,
  ) {
    this.app = app;
  }

  add<P1 = any, P2 = any>(name: string, schemaInitializer: SchemaInitializerV2<P1, P2>) {
    this.initializers[name] = schemaInitializer;
  }

  get<P1 = ButtonProps, P2 = ListProps<any>>(name: string): SchemaInitializerV2<P1, P2> | undefined {
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

  render<P1 = ButtonProps, P2 = ListProps<any>>(name: string, options?: SchemaInitializerOptions<P1, P2>) {
    const initializer = this.get<P1, P2>(name);
    if (!initializer) return null;
    return initializer.render(options);
  }

  getRender<P1 = ButtonProps, P2 = ListProps<any>>(name: string, options?: SchemaInitializerOptions<P1, P2>) {
    const initializer = this.get<P1, P2>(name);
    if (!initializer) {
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
