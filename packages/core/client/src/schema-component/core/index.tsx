export * from './DesignableSwitch';
export * from './FormProvider';
export * from './RemoteSchemaComponent';
export * from './SchemaComponent';
export * from './SchemaComponentOptions';
export * from './SchemaComponentProvider';
import { Plugin } from '../../application/Plugin';
import { DesignableSwitch } from './DesignableSwitch';
import { SchemaComponentProvider } from './SchemaComponentProvider';

export class SchemaComponentPlugin extends Plugin {
  async load() {
    this.addComponents();
    this.app.use(SchemaComponentProvider, { components: this.app.components, scope: this.app.scopes });
  }

  addComponents() {
    this.app.addComponents({
      DesignableSwitch,
    });
  }
}

export default SchemaComponentPlugin;
