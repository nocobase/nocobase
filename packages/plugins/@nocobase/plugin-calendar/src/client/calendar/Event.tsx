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
  useActionContext,
  useCollection,
  useCollectionRecordData,
  VariablePopupRecordProvider,
} from '@nocobase/client';
import React, { useCallback } from 'react';
import { DeleteEventContext } from './Calendar';

export const Event = observer(
  (props) => {
    const { visible, setVisible } = useActionContext();
    const recordData = useCollectionRecordData();
    const collection = useCollection();

    const close = useCallback(() => {
      setVisible(false);
    }, [setVisible]);
    return (
      <PopupContextProvider visible={visible} setVisible={setVisible}>
        <DeleteEventContext.Provider value={{ close, allowDeleteEvent: true }}>
          <VariablePopupRecordProvider recordData={recordData} collection={collection}>
            {props.children}
          </VariablePopupRecordProvider>
        </DeleteEventContext.Provider>
      </PopupContextProvider>
    );
  },
  { displayName: 'Event' },
);
