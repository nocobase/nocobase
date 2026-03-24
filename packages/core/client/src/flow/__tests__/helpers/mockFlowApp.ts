/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type FieldInterfaceConstructor = new (...args: any[]) => TestCollectionFieldInterface;

export class TestCollectionFieldInterface {
  name = '';
  group = '';
  filterable?: {
    operators?: any[];
    children?: any[];
  };
}

export function createMockFlowApp() {
  const components: Record<string, any> = {};
  const fieldInterfaceMap = new Map<string, TestCollectionFieldInterface>();
  const collectionFieldInterfaceManager = {
    getFieldInterface(name: string) {
      return fieldInterfaceMap.get(name);
    },
  };

  return {
    dataSourceManager: {
      collectionFieldInterfaceManager,
    },
    addFieldInterfaces(fieldInterfaceClasses: FieldInterfaceConstructor[] = []) {
      fieldInterfaceClasses.forEach((FieldInterfaceClass) => {
        const instance = new FieldInterfaceClass(collectionFieldInterfaceManager);
        if (instance?.name) {
          fieldInterfaceMap.set(instance.name, instance);
        }
      });
    },
    addComponents(nextComponents: Record<string, any>) {
      Object.assign(components, nextComponents);
    },
    getComponent(name: string) {
      return components[name];
    },
  };
}
