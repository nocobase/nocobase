import type { DataSourceManagerV2 } from '../data-source';
import type { CollectionTemplate, CollectionTemplateFactory } from './CollectionTemplate';

export class CollectionTemplateManagerV2 {
  protected collectionTemplateInstances: Record<string, CollectionTemplate> = {};

  constructor(
    templateClasses: CollectionTemplateFactory[],
    public dataSourceManager: DataSourceManagerV2,
  ) {
    this.addCollectionTemplates(templateClasses);
  }

  addCollectionTemplates(templateClasses: CollectionTemplateFactory[] = []) {
    const newCollectionTemplateInstances = templateClasses.reduce((acc, Template) => {
      const instance = new Template(this);
      acc[instance.name] = instance;
      return acc;
    }, {});
    Object.assign(this.collectionTemplateInstances, newCollectionTemplateInstances);

    return newCollectionTemplateInstances;
  }

  getCollectionTemplate<T extends CollectionTemplate>(name: string): T {
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
