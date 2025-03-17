/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/reactive-react';
import React from 'react';
import { Helper } from './Helper';
import { helpersObs } from './observables';
const _HelperList = () => {
  return (
    <>
      {helpersObs.value.map((helper, index) => {
        return <Helper key={index} index={index} label={helper.config.title} />;
      })}
    </>
  );
};

export const HelperList = observer(_HelperList, { displayName: 'HelperList' });
