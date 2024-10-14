/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import {
  PopupContextProvider,
  useCollection,
  useCollectionRecordData,
  VariablePopupRecordProvider,
} from '@nocobase/client';
import React from 'react';

export const Event = observer(
  (props) => {
    const recordData = useCollectionRecordData();
    const collection = useCollection();

    return (
      <PopupContextProvider>
        <VariablePopupRecordProvider recordData={recordData} collection={collection}>
          {props.children}
        </VariablePopupRecordProvider>
      </PopupContextProvider>
    );
  },
  { displayName: 'Event' },
);
