/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import {
  Action,
  ActionInitializer,
  CompatibleSchemaInitializer,
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
} from '@nocobase/client';
import React, { useContext } from 'react';
import { useChartFilter } from '../hooks/filter';
import { useChartsTranslation } from '../locale';
import { ChartFilterContext } from './FilterProvider';

export const useChartFilterActionProps = () => {
  const { filter } = useChartFilter();
  return {
    onClick: filter,
  };
};

export const useChartFilterResetProps = () => {
  const form = useForm();
  const { filter } = useChartFilter();
  return {
    onClick: async () => {
      form.reset();
      await filter();
    },
  };
};

export const useChartFilterCollapseProps = () => {
  const {
    collapse: { collapsed },
    setCollapse,
  } = useContext(ChartFilterContext);

  const { t } = useChartsTranslation();
  return {
    onClick: () => setCollapse({ collapsed: !collapsed }),
    title: (
      <>
        <DownOutlined rotate={!collapsed ? 180 : 0} /> {!collapsed ? t('Collapse') : t('Expand')}
      </>
    ),
  };
};

export const ChartFilterCollapseDesigner: React.FC = (props: any) => {
  const { t } = useChartsTranslation();
  return (
    <GeneralSchemaDesigner {...props} disableInitializer>
      <SchemaSettingsRemove
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
        }}
        confirm={{
          title: t('Delete action'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const ChartFilterActionDesigner: React.FC = (props: any) => {
  const { buttonEditorProps, ...restProps } = props;
  const { t } = useChartsTranslation();
  return (
    <GeneralSchemaDesigner {...restProps} disableInitializer>
      <Action.Designer.ButtonEditor {...buttonEditorProps} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
        }}
        confirm={{
          title: t('Delete action'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};

const ChartFilterActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Filter") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-use-component-props': 'useChartFilterActionProps',
    'x-designer': 'ChartFilterActionDesigner',
    'x-component-props': {
      htmlType: 'submit',
      type: 'primary',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

const ChartFilterResetInitializer = (props) => {
  const schema = {
    title: '{{ t("Reset") }}',
    'x-action': 'reset',
    'x-component': 'Action',
    'x-use-component-props': 'useChartFilterResetProps',
    'x-designer': 'ChartFilterActionDesigner',
  };
  return <ActionInitializer {...props} schema={schema} />;
};

const ChartFilterCollapseInitializer = (props) => {
  const schema = {
    title: `{{ t("Collapse") }}`,
    'x-action': 'collapse',
    'x-component': 'Action',
    'x-use-component-props': 'useChartFilterCollapseProps',
    'x-component-props': {
      type: 'link',
    },
    'x-designer': 'ChartFilterCollapseDesigner',
  };
  return <ActionInitializer {...props} schema={schema} />;
};

const commonOptions = {
  'data-testid': 'configure-actions-button-of-chart-filter',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      name: 'filter',
      type: 'item',
      title: '{{t("Filter")}}',
      component: ChartFilterActionInitializer,
      schema: {
        'x-action-settings': {},
      },
    },
    {
      name: 'reset',
      type: 'item',
      title: '{{t("Reset")}}',
      component: ChartFilterResetInitializer,
      schema: {
        'x-action-settings': {},
      },
    },
    {
      name: 'collapse',
      type: 'item',
      title: '{{t("Collapse")}}',
      component: ChartFilterCollapseInitializer,
      schema: {
        'x-action-settings': {},
      },
    },
  ],
};

/**
 * @deprecated
 * use `chartFilterActionInitializers` instead
 */
export const chartFilterActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ChartFilterActionInitializers',
  ...commonOptions,
});

export const chartFilterActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'chartFilterForm:configureActions',
    ...commonOptions,
  },
  chartFilterActionInitializers_deprecated,
);
