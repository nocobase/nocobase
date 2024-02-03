import type { Application } from '../../Application';
import type { DataSourceManagerV3 } from '../data-source';
import type { CollectionFieldInterfaceV3, CollectionFieldInterfaceFactory } from './CollectionFieldInterface';

export class CollectionFieldInterfaceManager {
  protected collectionFieldInterfaceInstances: Record<string, CollectionFieldInterfaceV3> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};

  constructor(
    fieldInterfaceClasses: CollectionFieldInterfaceFactory[],
    fieldInterfaceGroups: Record<string, { label: string; order?: number }>,
    public app: Application,
    public dataSourceManager: DataSourceManagerV3,
  ) {
    this.addFieldInterfaces(fieldInterfaceClasses);
    this.addFieldGroups(fieldInterfaceGroups);
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    const newCollectionFieldInterfaces = fieldInterfaceClasses.reduce((acc, Interface) => {
      const instance = new Interface(this.app, this.dataSourceManager);
      acc[instance.name] = instance;
      return acc;
    }, {});

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }
  getFieldInterface<T extends CollectionFieldInterfaceV3>(name: string) {
    return this.collectionFieldInterfaceInstances[name] as T;
  }
  getFieldInterfaces(dataSourceType?: string) {
    return Object.values(this.collectionFieldInterfaceInstances).filter((item) => {
      if (!dataSourceType) return true;
      if (!item.supportDataSourceType && !item.notSupportDataSourceType) return true;

      if (item.supportDataSourceType) {
        return item.supportDataSourceType?.includes(dataSourceType);
      }
      if (item.notSupportDataSourceType) {
        return !item.notSupportDataSourceType?.includes(dataSourceType);
      }
      return true;
    });
  }

  addFieldGroups(groups: Record<string, { label: string; order?: number }>) {
    Object.assign(this.collectionFieldGroups, groups);
  }
  getFieldGroups() {
    return this.collectionFieldGroups;
  }
  getFieldGroup(name: string) {
    return this.collectionFieldGroups[name];
  }
}
