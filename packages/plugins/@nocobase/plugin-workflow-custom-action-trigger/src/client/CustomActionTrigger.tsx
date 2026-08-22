/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SchemaInitializerItemType } from '@nocobase/client';
import { CollectionBlockInitializer } from '@nocobase/plugin-workflow/client';
import { CustomActionTrigger as V2CustomActionTrigger } from '../client-v2/triggers/CustomActionTrigger';
import { NAMESPACE } from './locale';

type CustomActionTriggerConfig = {
  global?: boolean;
  collection?: string;
};

export default class CustomActionTrigger extends V2CustomActionTrigger {
  useInitializers(config: CustomActionTriggerConfig): SchemaInitializerItemType | null {
    if (config.global || !config.collection) {
      return null;
    }

    return {
      name: 'triggerData',
      type: 'item',
      key: 'triggerData',
      title: `{{t("Trigger data", { ns: "workflow" })}}`,
      Component: CollectionBlockInitializer,
      collection: config.collection,
      dataPath: '$context.data',
    };
  }
}

export { NAMESPACE };
