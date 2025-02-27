/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx, SortableItem, useDesigner, useToken, useSchemaSettingsRender } from '@nocobase/client';
import React, { useMemo } from 'react';

export function UserCenter() {
  const { render } = useSchemaSettingsRender('userCenterSettings');
  return <div style={{ display: 'inline-block', width: '100%' }}>{render({ mode: 'inline' })}</div>;
}

export const InternalSettings = () => {
  const Designer = useDesigner();
  const { token } = useToken();
  const style = useMemo(() => {
    return {
      marginBottom: token.marginBlock,
      borderRadius: token.borderRadiusBlock,
      overflow: 'hidden',
    };
  }, [token.borderRadiusBlock, token.marginBlock]);

  return (
    <SortableItem className={cx('nb-mobile-setting')} style={style}>
      <Designer />
      <UserCenter />
    </SortableItem>
  );
};
export const MobileSettings = InternalSettings;
