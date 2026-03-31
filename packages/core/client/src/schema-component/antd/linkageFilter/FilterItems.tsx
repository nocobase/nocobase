/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField as ArrayFieldModel } from '@formily/core';
import { ObjectField, observer, useField } from '@formily/react';
import React from 'react';
import { FilterGroup } from './FilterGroup';
import { LinkageFilterItem } from './LinkageFilterItem';
import { RemoveConditionContext } from './context';

export const FilterItems = observer(
  (props) => {
    const field = useField<ArrayFieldModel>();
    return (
      <div>
        {field?.value?.filter(Boolean).map((item, index) => {
          return (
            <RemoveConditionContext.Provider key={index} value={() => field.remove(index)}>
              <ObjectField name={index} component={[item.$and || item.$or ? FilterGroup : LinkageFilterItem]} />
            </RemoveConditionContext.Provider>
          );
        })}
      </div>
    );
  },
  { displayName: 'FilterItems' },
);
