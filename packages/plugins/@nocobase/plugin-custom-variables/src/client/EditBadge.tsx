/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import {
  ColorPicker,
  InputNumber,
  SchemaSettingsModalItem,
  useCurrentRoute,
  useNocoBaseRoutes,
  useVariableOptions,
  Variable,
} from '@nocobase/client';
import type { ISchema } from '@formily/react';
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from '../locale';

type BadgeOptions = Record<string, any> | undefined;
type BadgeTranslate = (key: string, options?: Record<string, any>) => any;

export const BadgeVariableTextArea = (props) => {
  const variables = useVariableOptions({} as any);
  return <Variable.TextArea {...props} scope={variables} />;
};

BadgeVariableTextArea.displayName = 'BadgeVariableTextArea';

export const normalizeBadgeValues = (badge: Record<string, any>) => ({
  ...badge,
  count: badge?.count == null || badge.count === '' ? undefined : badge.count,
});

export const mergeBadgeIntoRouteOptions = (options: BadgeOptions, badge: Record<string, any>) => ({
  ...options,
  badge: {
    ...options?.badge,
    ...normalizeBadgeValues(badge),
  },
});

export const getBadgeFieldsSchema = (
  t: BadgeTranslate,
  badgeComponent: ISchema['x-component'] = BadgeVariableTextArea,
): Record<string, ISchema> => ({
  count: {
    title: t('Badge'),
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      tooltip: t('You can enter numbers, text, variables, aggregation variables, expressions, etc.'),
    },
    'x-component': badgeComponent,
    description: (
      <span>
        {t('Syntax references: ')}
        <a href="https://docs.nocobase.com/handbook/calculation-engines/formula" target="_blank" rel="noreferrer">
          Formula.js
        </a>
      </span>
    ),
  },
  color: {
    title: t('Background color'),
    'x-decorator': 'FormItem',
    'x-component': ColorPicker,
    'x-component-props': {},
  },
  textColor: {
    title: t('Text color'),
    'x-decorator': 'FormItem',
    'x-component': ColorPicker,
    'x-component-props': {},
  },
  size: {
    title: t('Size'),
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: t('Default'), value: 'default' },
      { label: t('Small'), value: 'small' },
    ],
    default: 'default',
  },
  overflowCount: {
    title: t('Max number'),
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      tooltip: t('Maximum number to display when the badge is a number'),
    },
    'x-component': InputNumber,
    default: 99,
  },
  showZero: {
    title: t('Show zero'),
    'x-decorator': 'FormItem',
    'x-decorator-props': {
      tooltip: t('Whether to show the badge when it is a number and the number is 0'),
    },
    'x-component': 'Checkbox',
    default: false,
  },
});

const EditBadge: FC = () => {
  const { t } = useTranslation(NAMESPACE);
  const currentRoute = useCurrentRoute();
  const { updateRoute } = useNocoBaseRoutes();

  const schema = useMemo(() => {
    return {
      type: 'object',
      title: t('Edit badge'),
      properties: getBadgeFieldsSchema(t, BadgeVariableTextArea),
    };
  }, [t]);

  const initialValues = useMemo(() => {
    return currentRoute.options?.badge;
  }, [currentRoute.options?.badge]);

  const onEditBadgeSubmit: (values: any) => void = useCallback(
    (badge) => {
      // Update the route corresponding to the menu
      if (currentRoute.id !== undefined) {
        updateRoute(currentRoute.id, {
          options: mergeBadgeIntoRouteOptions(currentRoute.options, badge),
        });
      }
    },
    [currentRoute.id, currentRoute.options, updateRoute],
  );

  return (
    <SchemaSettingsModalItem
      title={t('Edit badge')}
      eventKey="edit-badge"
      schema={schema as ISchema}
      initialValues={initialValues}
      onSubmit={onEditBadgeSubmit}
    />
  );
};

export default EditBadge;
