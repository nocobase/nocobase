/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Trigger } from '..';
import { NAMESPACE } from '../../locale';

export default class CollectionTrigger extends Trigger {
  title = `{{t("Collection event", { ns: "${NAMESPACE}" })}}`;
  description = `{{t('Triggered when data changes in the collection, such as after adding, updating, or deleting a record. Unlike "Post-action event", Collection event listens for data changes rather than HTTP requests. Unless you understand the exact meaning, it is recommended to use "Post-action event".', { ns: "${NAMESPACE}" })}}`;

  PresetFieldsetLoader = () => import('./CreateConfigForm');
}
