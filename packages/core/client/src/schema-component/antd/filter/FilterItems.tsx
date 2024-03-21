import { ArrayField as ArrayFieldModel } from '@formily/core';
import { ObjectField, observer, useField } from '@formily/react';
import React from 'react';
import { FilterGroup } from './FilterGroup';
import { FilterItem } from './FilterItem';
import { RemoveConditionContext } from './context';

export const FilterItems = observer(
  (props) => {
    const field = useField<ArrayFieldModel>();
    return (
      <div>
        {field?.value?.filter(Boolean).map((item, index) => {
          return (
            <RemoveConditionContext.Provider key={index} value={() => field.remove(index)}>
              <ObjectField name={index} component={[item.$and || item.$or ? FilterGroup : FilterItem]} />
            </RemoveConditionContext.Provider>
          );
        })}
      </div>
    );
  },
  { displayName: 'FilterItems' },
);
