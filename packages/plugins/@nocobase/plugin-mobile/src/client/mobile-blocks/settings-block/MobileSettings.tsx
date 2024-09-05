/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx, SettingsMenu, SortableItem, useDesigner, useToken } from '@nocobase/client';
import React, { useMemo } from 'react';

export const InternalSettings = () => {
  const Designer = useDesigner();
  const { token } = useToken();
  const style = useMemo(() => {
    return {
      marginBottom: token.marginBlock,
    };
  }, [token.marginBlock]);

  return (
    <SortableItem className={cx('nb-mobile-setting')} style={style}>
      <Designer />
      <SettingsMenu />
    </SortableItem>
  );
};
export const MobileSettings = InternalSettings;
