/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useCallback, useMemo } from 'react';
import ActionDrawer from '../../schema-component/antd/action/Action.Drawer';
import ActionModal from '../../schema-component/antd/action/Action.Modal';
import ActionPage from '../../schema-component/antd/action/Action.Page';

type OpenMode = 'drawer' | 'page' | 'modal';

interface OpenModeProviderProps {
  /**
   * @default 'drawer'
   * open mode 的全局默认值
   */
  defaultOpenMode?: OpenMode;
  /**
   * @default { drawer: ActionDrawer, page: ActionPage, modal: ActionModal }
   * 根据 open mode 获取对应的组件
   */
  openModeToComponent?: Partial<Record<OpenMode, any>>;
  /**
   * @default false
   * 隐藏 open mode 的配置选项
   */
  hideOpenMode?: boolean;
  /**
   * @default false
   * 是否为Mobile路由下
   */
  isMobile?: boolean;
}

const defaultContext: OpenModeProviderProps = {
  defaultOpenMode: 'drawer',
  openModeToComponent: {
    drawer: ActionDrawer,
    page: ActionPage,
    modal: ActionModal,
  },
  hideOpenMode: false,
};

const OpenModeContext = React.createContext<{
  defaultOpenMode: OpenModeProviderProps['defaultOpenMode'];
  hideOpenMode: boolean;
  getComponentByOpenMode: (openMode: OpenMode) => any;
  isMobile: boolean;
}>(null);

/**
 * 为按钮的 Open mode 选项提供上下文
 * @param props
 * @returns
 */
export const OpenModeProvider: FC<OpenModeProviderProps> = (props) => {
  const context = useMemo(() => {
    const result = { ...defaultContext };

    if (props.defaultOpenMode !== undefined) {
      result.defaultOpenMode = props.defaultOpenMode;
    }
    if (props.openModeToComponent !== undefined) {
      result.openModeToComponent = props.openModeToComponent;
    }
    if (props.hideOpenMode !== undefined) {
      result.hideOpenMode = props.hideOpenMode;
    }
    if (props.isMobile) {
      result.isMobile = props.isMobile;
    }
    return result;
  }, [props.defaultOpenMode, props.openModeToComponent, props.hideOpenMode]);

  const getComponentByOpenMode = useCallback(
    (openMode: OpenMode) => {
      const result = context.openModeToComponent[openMode];

      if (!result) {
        console.error(`OpenModeProvider: openModeToComponent[${openMode}] is not defined`);
      }

      return result;
    },
    [context],
  );

  const value = useMemo(() => {
    return {
      defaultOpenMode: context.defaultOpenMode,
      hideOpenMode: context.hideOpenMode,
      getComponentByOpenMode,
      isMobile: context.isMobile,
    };
  }, [context.defaultOpenMode, context.hideOpenMode, getComponentByOpenMode, context.isMobile]);

  return <OpenModeContext.Provider value={value}>{props.children}</OpenModeContext.Provider>;
};

export const useOpenModeContext = () => {
  return React.useContext(OpenModeContext);
};
