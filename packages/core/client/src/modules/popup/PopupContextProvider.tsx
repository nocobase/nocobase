/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { useCallback, useContext, useState } from 'react';
import { ActionContextProvider } from '../../schema-component';
import { PopupVisibleProvider, PopupVisibleProviderContext } from '../../schema-component/antd/page/PagePopups';

/**
 * provider the context for popup to work
 * @param props
 * @returns
 */
export const PopupContextProvider: React.FC<{
  visible?: boolean;
  setVisible?: (visible: boolean) => void;
  openMode?: string;
  openSize?: string;
}> = (props) => {
  const { visible: visibleFromProps, setVisible: setVisibleFromProps } = props;
  const [visible, setVisible] = useState(false);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const { visible: visibleWithURL, setVisible: setVisibleWithURL } = useContext(PopupVisibleProviderContext) || {
    visible: false,
    setVisible: () => {},
  };
  const fieldSchema = useFieldSchema();
  const _setVisible = useCallback(
    (value: boolean): void => {
      setVisibleFromProps?.(value);
      setVisible?.(value);
      setVisibleWithURL?.(value);
    },
    [setVisibleFromProps, setVisibleWithURL],
  );
  const openMode = props.openMode || fieldSchema['x-component-props']?.['openMode'] || 'drawer';
  const openSize = props.openSize || fieldSchema['x-component-props']?.['openSize'];

  return (
    <PopupVisibleProvider visible={false}>
      <ActionContextProvider
        visible={visibleFromProps || visible || visibleWithURL}
        setVisible={_setVisible}
        openMode={openMode}
        openSize={openSize}
        formValueChanged={formValueChanged}
        setFormValueChanged={setFormValueChanged}
      >
        {props.children}
      </ActionContextProvider>
    </PopupVisibleProvider>
  );
};
