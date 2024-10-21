/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDataBlockRequest } from '../../../data-source';
import { useCurrentPopupContext } from '../page/PagePopups';
import { getBlockService, storeBlockService } from '../page/pagePopupUtils';
import { ActionContextProps } from './types';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

/**
 * Used to determine if the user closed the sub-page by clicking on the page menu
 * @returns
 */
const useIsSubPageClosedByPageMenu = () => {
  // Used to trigger re-rendering when URL changes
  const params = useParams();
  const prevParamsRef = useRef<any>({});
  const fieldSchema = useFieldSchema();

  const isSubPageClosedByPageMenu = useMemo(() => {
    const result =
      _.isEmpty(params['*']) &&
      fieldSchema?.['x-component-props']?.openMode === 'page' &&
      !!prevParamsRef.current['*']?.includes(fieldSchema['x-uid']);

    prevParamsRef.current = params;

    return result;
  }, [fieldSchema, params]);

  return isSubPageClosedByPageMenu;
};

export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = (props) => {
  const [submitted, setSubmitted] = useState(false); //是否有提交记录
  const { visible } = { ...props, ...props.value } || {};
  const { setSubmitted: setParentSubmitted } = { ...props, ...props.value };
  const service = useBlockServiceInActionButton();
  const isSubPageClosedByPageMenu = useIsSubPageClosedByPageMenu();

  useEffect(() => {
    if (visible === false && service && !service.loading && (submitted || isSubPageClosedByPageMenu)) {
      service.refresh();
      service.loading = true;
      setParentSubmitted?.(true); //传递给上一层
    }

    return () => {
      setSubmitted(false);
    };
  }, [visible, service?.refresh, setParentSubmitted, isSubPageClosedByPageMenu]);

  return (
    <ActionContext.Provider value={{ ...props, ...props?.value, submitted, setSubmitted }}>
      {props.children}
    </ActionContext.Provider>
  );
};

const useBlockServiceInActionButton = () => {
  const { params } = useCurrentPopupContext();
  const fieldSchema = useFieldSchema();
  const popupUidWithoutOpened = useFieldSchema()?.['x-uid'];
  const service = useDataBlockRequest();
  const currentPopupUid = params?.popupuid;

  // 把 service 存起来
  useEffect(() => {
    if (popupUidWithoutOpened && currentPopupUid !== popupUidWithoutOpened) {
      storeBlockService(popupUidWithoutOpened, { service });
    }
  }, [popupUidWithoutOpened, service, currentPopupUid, fieldSchema]);

  // 关闭弹窗时，获取到对应的 service
  if (currentPopupUid === popupUidWithoutOpened) {
    return getBlockService(currentPopupUid)?.service || service;
  }

  return service;
};
