/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { createContext, useEffect, useState } from 'react';
import { useDataBlockRequest } from '../../../data-source';
import { useCurrentPopupContext } from '../page/PagePopups';
import { getBlockService, storeBlockService } from '../page/pagePopupUtils';
import { ActionContextProps } from './types';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const [submitted, setSubmitted] = useState(false); //是否有提交记录
  const { visible } = { ...props, ...props.value } || {};
  const { setSubmitted: setParentSubmitted } = { ...props, ...props.value };
  const service = useBlockServiceInActionButton();

  useEffect(() => {
    if (visible === false && submitted && service) {
      service.refresh();
      setParentSubmitted?.(true); //传递给上一层
    }

    return () => {
      setSubmitted(false);
    };
  }, [visible, service]);

  return (
    <ActionContext.Provider value={{ ...props, ...props?.value, submitted, setSubmitted }}>
      {props.children}
    </ActionContext.Provider>
  );
};

const useBlockServiceInActionButton = () => {
  const { params } = useCurrentPopupContext();
  const popupUidWithoutOpened = useFieldSchema()?.['x-uid'];
  const service = useDataBlockRequest();
  const currentPopupUid = params?.popupuid;

  // By using caching, we solve the problem of not being able to obtain the correct service when closing a popup through a URL
  useEffect(() => {
    // This case refers to when the current button is rendered on a page or in a popup
    if (popupUidWithoutOpened && currentPopupUid !== popupUidWithoutOpened) {
      storeBlockService(popupUidWithoutOpened, { service });
    }
  }, [popupUidWithoutOpened, service, currentPopupUid]);

  // This case refers to when the current button is closed as a popup (the button's uid is the same as the popup's uid)
  if (currentPopupUid === popupUidWithoutOpened) {
    return getBlockService(currentPopupUid)?.service || service;
  }

  return service;
};
