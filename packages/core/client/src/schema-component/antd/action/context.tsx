/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { createContext, FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { UseRequestResult } from '../../../api-client/hooks/useRequest';
import { useIsSubPageClosedByPageMenu } from '../../../application/CustomRouterContextProvider';
import { useDataBlockRequest } from '../../../data-source';
import { useCurrentPopupContext } from '../page/PagePopups';
import { getBlockService, storeBlockService } from '../page/pagePopupUtils';
import { ActionContextProps } from './types';

export const ActionContext = createContext<ActionContextProps>({});
ActionContext.displayName = 'ActionContext';

let loading = false;
export const ActionContextProvider: React.FC<ActionContextProps & { value?: ActionContextProps }> = React.memo(
  (props) => {
    const [submitted, setSubmitted] = useState(false); //是否有提交记录
    const { visible } = { ...props, ...props.value };
    const { setSubmitted: setParentSubmitted } = { ...props, ...props.value };
    const service = useBlockServiceInActionButton();
    const isSubPageClosedByPageMenu = useIsSubPageClosedByPageMenu(useFieldSchema());

    useEffect(() => {
      const run = async () => {
        if (visible === false && service && !loading && (submitted || isSubPageClosedByPageMenu)) {
          // Prevent multiple requests from being triggered
          loading = true;
          await service.refreshAsync();
          loading = false;

          setParentSubmitted?.(true); //传递给上一层
        }
      };

      run();

      return () => {
        setSubmitted(false);
      };
    }, [visible, service?.refresh, setParentSubmitted, isSubPageClosedByPageMenu]);

    const value = useMemo(() => ({ ...props, ...props?.value, submitted, setSubmitted }), [props, submitted]);

    return <ActionContext.Provider value={value}>{props.children}</ActionContext.Provider>;
  },
);

ActionContextProvider.displayName = 'ActionContextProvider';

const useBlockServiceInActionButton = (): UseRequestResult<any> => {
  const { params } = useCurrentPopupContext();
  const popupUidWithoutOpened = useFieldSchema()?.['x-uid'];
  const service = useDataBlockRequest();
  const currentPopupUid = params?.popupuid;

  // 把 service 存起来
  useEffect(() => {
    if (popupUidWithoutOpened && currentPopupUid !== popupUidWithoutOpened) {
      storeBlockService(popupUidWithoutOpened, { service });
    }
  }, [currentPopupUid, popupUidWithoutOpened, service]);

  // 关闭弹窗时，获取到对应的 service
  if (currentPopupUid === popupUidWithoutOpened) {
    return getBlockService(currentPopupUid)?.service || service;
  }

  return service;
};

/**
 * Provides the latest Action context value without re-rendering components to improve rendering performance
 */
export const ActionContextNoRerender: FC = React.memo((props) => {
  const value = useContext(ActionContext);
  const valueRef = useRef({});

  Object.assign(valueRef.current, value);

  return <ActionContext.Provider value={valueRef.current}>{props.children}</ActionContext.Provider>;
});

ActionContextNoRerender.displayName = 'ActionContextNoRerender';
