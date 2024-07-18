/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, CollectionFieldInterface, CollectionFieldInterfaceFactory } from '@nocobase/client';

export class FieldInterfaceManager {
  constructor(protected app: Application) {}

  fieldInterfaces = new Map<string, CollectionFieldInterface>();

  addFieldInterfaces(...fieldInterfaces: CollectionFieldInterfaceFactory[]) {
    fieldInterfaces.forEach((Interface) => {
      const instance = new Interface(this.app.dataSourceManager.collectionFieldInterfaceManager);
      this.fieldInterfaces.set(instance.name, instance);
    });
  }
}
