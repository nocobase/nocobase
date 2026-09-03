/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { BarChartOutlined } from '@ant-design/icons';
import type { SubModelItem } from '@nocobase/flow-engine';
import {
  BaseTypeSets,
  defaultFieldNames,
  Instruction,
  type UseVariableOptions,
  type VariableOption,
} from '@nocobase/plugin-workflow/client-v2';
import { NAMESPACE } from './locale';

type AggregateNodeLike = {
  id?: string | number;
  key: string;
  title?: string;
  config?: {
    collection?: string;
  };
};

const t = (key: string) => `{{t("${key}", { ns: "${NAMESPACE}" })}}`;

export default class AggregateInstruction extends Instruction {
  title = t('Aggregate');
  type = 'aggregate';
  group = 'collection';
  description = t(
    'Counting, summing, finding maximum, minimum, and average values for multiple records of a collection or associated data of a record.',
  );
  icon = (<BarChartOutlined />);

  FieldsetLoader = () =>
    import('./components/AggregateFieldset').then((module) => ({ default: module.AggregateFieldset }));

  createDefaultConfig() {
    return {
      aggregator: 'count',
      associated: false,
      precision: 2,
    };
  }

  useVariables(
    { key, title }: AggregateNodeLike,
    { types, fieldNames = defaultFieldNames }: UseVariableOptions = {},
  ): VariableOption | null {
    if (
      types &&
      !types.some((type) => {
        if (typeof type !== 'string') {
          return false;
        }
        return type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type));
      })
    ) {
      return null;
    }

    return {
      [fieldNames.value]: key,
      [fieldNames.label]: title,
    };
  }

  getCreateModelMenuItem({ node }: { node: AggregateNodeLike }): SubModelItem | null {
    if (!node.config?.collection) {
      return null;
    }

    return {
      key: `#${node.id}`,
      label: node.title ?? `#${node.id}`,
      useModel: 'NodeValueModel',
      createModelOptions: {
        use: 'NodeValueModel',
        stepParams: {
          valueSettings: {
            init: {
              dataSource: `{{$jobsMapByNodeKey.${node.key}}}`,
              defaultValue: t('Query result'),
            },
          },
          cardSettings: {
            titleDescription: {
              title: t('Aggregate'),
            },
          },
        },
      },
    };
  }
}
