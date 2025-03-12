/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useContext } from 'react';
import { observer } from '@formily/reactive-react';
import type { MenuProps } from 'antd';
import { Dropdown, Popover } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { useCompile } from '../../../hooks';
import { useApp } from '../../../../application';
import { addHelper } from './observables';
import { helpersObs } from './observables';
import { Helper } from './Helper';
const _HelperList = () => {
  return (
    <>
      {helpersObs.value.map((helper, index) => {
        return (
          <Helper
            key={index}
            index={index}
            configurable={Boolean(helper.config.uiSchema)}
            label={helper.config.title}
          />
        );
      })}
    </>
  );
};

export const HelperList = observer(_HelperList, { displayName: 'HelperList' });
