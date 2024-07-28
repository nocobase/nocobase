/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useToken } from '../../../style';
import { useActionContext } from '../action/hooks';

export const useBackButton = () => {
  const { setVisible } = useActionContext();
  const goBack = useCallback(() => {
    setVisible?.(false);
  }, [setVisible]);

  return {
    goBack,
  };
};

/**
 * Used for the back button in subpages
 * @returns
 */
export const BackButtonUsedInSubPage = () => {
  const { token } = useToken();
  const { goBack } = useBackButton();
  // tab item gutter, this is fixed value in antd
  const horizontalItemGutter = 32;

  const resetStyle = useMemo(() => {
    return {
      width: 'auto',
      height: 'auto',
      lineHeight: 1,
      padding: token.paddingXS,
      marginRight: horizontalItemGutter - token.paddingXS,
    };
  }, [token.paddingXS]);

  return (
    <Button aria-label="back-button" type="text" icon={<ArrowLeftOutlined />} style={resetStyle} onClick={goBack} />
  );
};
