/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  PopupContextProvider,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  usePopupUtils,
  useProps,
  withDynamicSchemaProps,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { MapBlockComponent } from '../components';
import { MapBlockDrawer } from '../components/MapBlockDrawer';

export const MapBlock = withDynamicSchemaProps((props) => {
  const { context } = usePopupUtils();

  // only render the popup
  if (context.currentLevel) {
    return (
      <PopupContextProvider>
        <MapBlockDrawer />
      </PopupContextProvider>
    );
  }

  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { fieldNames } = useProps(props);

  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { name } = useCollection_deprecated();
  const collectionField = useMemo(() => {
    return getCollectionJoinField([name, fieldNames?.field].flat().join('.'));
  }, [name, fieldNames?.field]);

  const fieldComponentProps = collectionField?.uiSchema?.['x-component-props'];
  return <MapBlockComponent {...fieldComponentProps} {...props} collectionField={collectionField} />;
});
