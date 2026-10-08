/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_FIELD_TYPES, normalizeInterfaceName } from '../modeling/fields';

/**
 * The browser form applies each field interface's default data type before
 * calling the API; a direct API caller that sends only an interface got no
 * default at all, and the request later failed deep inside the database
 * layer with "unsupported field type null" (#10398). Resolve the documented
 * default here so every creation path agrees: when no explicit type is set
 * and the (normalized) interface has a default, apply it.
 */
export function beforeCreateForInterfaceDefaultType() {
  return async (model) => {
    if (model.get('source')) {
      return;
    }

    if (model.get('type')) {
      return;
    }

    const interfaceName = normalizeInterfaceName(model.get('interface'));
    const defaultType = interfaceName ? DEFAULT_FIELD_TYPES[interfaceName] : undefined;

    if (defaultType) {
      model.set('type', defaultType);
    }
  };
}
