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
import { useVariable } from '../VariableProvider';
import { Helper } from './Helper';

const _HelperList = () => {
  const { helperObservables, openLastHelper } = useVariable();
  const { helpersObs, rawHelpersObs } = helperObservables;

  return (
    <>
      {helpersObs.value.map((helper, index) => {
        return (
          <Helper
            key={index}
            index={index}
            defaultOpen={helpersObs.value.length === index + 1 ? openLastHelper : false}
            label={helper.config.name}
          />
        );
      })}
    </>
  );
};

export const HelperList = observer(_HelperList, { displayName: 'HelperList' });
