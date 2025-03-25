/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Filter } from '../Filter';
import { useFilterOptions } from '../hooks/useFilterOptions';
import { ArrayBase } from '@formily/antd-v5';
import { css } from '@emotion/css';
import { getShouldChange } from '../../../schema-settings/VariableInput';
import { DynamicComponentProps } from '../../../schema-component/antd/filter/DynamicComponent';
import { VariableInput } from '../../../schema-settings/VariableInput';
import { uniqBy } from 'lodash';
import { useVariableOptions } from '../hooks/useVariableOptions';
import { EventSetting } from '../../types';
import { useField } from '@formily/react';
import { ObjectField } from '@formily/core';
import { useUpdateEffect } from 'ahooks';

export default function ConditionSelect(props: { event?: EventSetting['event']; onChange?: any }) {
  const filterOptions = useFilterOptions(props.event);
  const variableOptions = useVariableOptions();
  const field = useField<ObjectField>();
  useUpdateEffect(() => {
    // 当 event 变化时，清空 condition
    // TODO: 条件判定进行清空
    field.value = {};
  }, [JSON.stringify(props.event)]);

  return (
    <Filter
      options={filterOptions}
      dynamicComponent={(props: DynamicComponentProps) => {
        const { collectionField } = props;
        return (
          <VariableInput
            {...props}
            // form={form}
            // record={record}
            shouldChange={getShouldChange({
              // collectionField,
              // variables,
              // localVariables,
              // getAllCollectionsInheritChain,
            })}
            returnScope={(scope) => {
              return uniqBy([...scope, ...variableOptions], 'key');
            }}
          />
        );
      }}
      {...props}
    />
  );
}

// 'x-use-component-props': () => {
//   return {
//     options: filterOptions,
//     className: css`
//       position: relative;
//       width: 100%;
//       margin-left: 10px;
//     `,
//   };
// },

// 'x-component-props': {
//   collectionName,
//   dynamicComponent: (props: DynamicComponentProps) => {
//     const { collectionField } = props;
//     return (
//       <VariableInput
//         {...props}
//         form={form}
//         record={record}
//         shouldChange={getShouldChange({
//           collectionField,
//           variables,
//           localVariables,
//           getAllCollectionsInheritChain,
//         })}
//         returnScope={(scope) => {
//           return uniqBy([...scope, ...variableOptions], 'key');
//         }}
//       />
//     );
//   },
// },
