import { SettingMenu } from '@nocobase/client';
import React from 'react';
import { SettingDesigner } from './Setting.Designer';
import { css, cx } from '@emotion/css';

export const InternalSetting = () => {
  return (
    <div
      className={cx(
        'nb-mobile-setting',
        css`
          margin-bottom: var(--nb-spacing);
        `,
      )}
    >
      <SettingMenu />
    </div>
  );
};
export const MSetting = InternalSetting as unknown as typeof InternalSetting & {
  Designer: typeof SettingDesigner;
};

MSetting.Designer = SettingDesigner;
