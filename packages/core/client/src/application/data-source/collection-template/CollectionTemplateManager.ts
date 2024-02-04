import type { Application } from '../../Application';
import type { DataSourceManagerV3 } from '../data-source';
import type { CollectionTemplateV3, CollectionTemplateFactory } from './CollectionTemplate';

export class CollectionTemplateManagerV3 {
  protected collectionTemplateInstances: Record<string, CollectionTemplateV3> = {};

  constructor(
    templateClasses: CollectionTemplateFactory[],
    public app: Application,
    public dataSourceManager: DataSourceManagerV3,
  ) {
    this.addCollectionTemplates(templateClasses);
  }

  addCollectionTemplates(templateClasses: CollectionTemplateFactory[] = []) {
    const newCollectionTemplateInstances = templateClasses.reduce((acc, Template) => {
      const instance = new Template(this.app, this.dataSourceManager);
      acc[instance.name] = instance;
      return acc;
    }, {});
    Object.assign(this.collectionTemplateInstances, newCollectionTemplateInstances);

    return newCollectionTemplateInstances;
  }

  getCollectionTemplate<T extends CollectionTemplateV3>(name: string): T {
    return this.collectionTemplateInstances[name] as T;
  }

  getCollectionTemplates(dataSourceType?: string) {
    return Object.values(this.collectionTemplateInstances)
      .filter((item) => {
        if (!dataSourceType) return true;
        if (!item.supportDataSourceType && !item.notSupportDataSourceType) return true;

        if (item.supportDataSourceType) {
          return item.supportDataSourceType?.includes(dataSourceType);
        }
        if (item.notSupportDataSourceType) {
          return !item.notSupportDataSourceType?.includes(dataSourceType);
        }
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}
