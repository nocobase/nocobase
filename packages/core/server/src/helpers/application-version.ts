import { Collection } from '@nocobase/database';
import semver from 'semver';
import Application from '../application';

export class ApplicationVersion {
  protected app: Application;
  protected collection: Collection;

  constructor(app: Application) {
    this.app = app;
    app.db.collection({
      origin: '@nocobase/server',
      name: 'applicationVersion',
      dataType: 'meta',
      timestamps: false,
      dumpRules: 'required',
      fields: [{ name: 'value', type: 'string' }],
    });
    this.collection = this.app.db.getCollection('applicationVersion');
  }

  async get() {
    const model = await this.collection.model.findOne();
    if (!model) {
      return null;
    }
    return model.get('value') as any;
  }

  async update(version?: string) {
    await this.collection.model.destroy({
      truncate: true,
    });

    await this.collection.model.create({
      value: version || this.app.getVersion(),
    });
  }

  async satisfies(range: string) {
    const model: any = await this.collection.model.findOne();
    const version = model?.value as any;
    if (!version) {
      return true;
    }
    return semver.satisfies(version, range, { includePrerelease: true });
  }
}
