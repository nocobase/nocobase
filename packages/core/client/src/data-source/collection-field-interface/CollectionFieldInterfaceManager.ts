import type { DataSourceManager } from '../data-source';
import type { CollectionFieldInterface, CollectionFieldInterfaceFactory } from './CollectionFieldInterface';

export class CollectionFieldInterfaceManager {
  protected collectionFieldInterfaceInstances: Record<string, CollectionFieldInterface> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};

  constructor(
    fieldInterfaceClasses: CollectionFieldInterfaceFactory[],
    fieldInterfaceGroups: Record<string, { label: string; order?: number }>,
    public dataSourceManager: DataSourceManager,
  ) {
    this.addFieldInterfaces(fieldInterfaceClasses);
    this.addFieldInterfaceGroups(fieldInterfaceGroups);
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    const newCollectionFieldInterfaces = fieldInterfaceClasses.reduce((acc, Interface) => {
      const instance = new Interface(this);
      acc[instance.name] = instance;
      return acc;
    }, {});

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }
  getFieldInterface<T extends CollectionFieldInterface>(name: string) {
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

  addFieldInterfaceGroups(groups: Record<string, { label: string; order?: number }>) {
    Object.assign(this.collectionFieldGroups, groups);
  }
  getFieldInterfaceGroups() {
    return this.collectionFieldGroups;
  }
  getFieldInterfaceGroup(name: string) {
    return this.collectionFieldGroups[name];
  }
}
