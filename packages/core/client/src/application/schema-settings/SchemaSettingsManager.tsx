import { Application } from '../Application';
import { SchemaSetting } from './SchemaSetting';

export class SchemaSettingsManager {
  protected schemaSettings: Record<string, SchemaSetting<any>> = {};

  constructor(
    protected _schemaSettings: SchemaSetting<any>[] = [],
    protected app: Application,
  ) {
    this.app = app;

    _schemaSettings.forEach((item) => this.add(item));
  }

  add<T>(SchemaSetting: SchemaSetting<T>) {
    this.schemaSettings[SchemaSetting.name] = SchemaSetting;
  }

  get<T>(name: string): SchemaSetting<T> | undefined {
    return this.schemaSettings[name];
  }

  getAll() {
    return this.schemaSettings;
  }

  has(name: string) {
    return !!this.get(name);
  }

  remove(name: string) {
    delete this.schemaSettings[name];
  }
}
