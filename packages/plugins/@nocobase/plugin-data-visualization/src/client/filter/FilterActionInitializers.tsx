import { useField, useForm } from '@formily/react';
import { ActionInitializer } from '@nocobase/client';
import React, { useContext } from 'react';
import { useChartFilter } from '../hooks/filter';
import { ChartFilterContext } from './FilterProvider';
import { useChartsTranslation } from '../locale';

export const useChartFilterActionProps = () => {
  const { filter } = useChartFilter();
  return {
    onClick: filter,
  };
};

export const useChartFilterResetProps = () => {
  const form = useForm();
  const { refresh } = useChartFilter();
  return {
    onClick: async () => {
      await refresh();
      form.reset();
    },
  };
};

export const useChartFilterCollapseProps = () => {
  const { collapse, setCollapse } = useContext(ChartFilterContext);
  const { t } = useChartsTranslation();
  const field = useField();
  return {
    onClick: () => {
      setCollapse(!collapse);
      field.componentProps.title = collapse ? t('Collapse') : t('Expand');
    },
  };
};

const ChartFilterActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Filter") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      useProps: '{{ useChartFilterActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

const ChartFilterResetInitializer = (props) => {
  const schema = {
    title: '{{ t("Reset") }}',
    'x-action': 'reset',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      useProps: '{{ useChartFilterResetProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

const ChartFilterCollapseInitializer = (props) => {
  const schema = {
    title: `{{ t("Collapse") }}`,
    'x-action': 'collapse',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      useProps: '{{ useChartFilterCollapseProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const ChartFilterActionInitializers = {
  'data-testid': 'configure-actions-button-of-chart-filter',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("Filter")}}',
          component: ChartFilterActionInitializer,
          schema: {
            'x-action-settings': {},
          },
        },
        {
          type: 'item',
          title: '{{t("Reset")}}',
          component: ChartFilterResetInitializer,
          schema: {
            'x-action-settings': {},
          },
        },
        {
          type: 'item',
          title: '{{t("Collapse")}}',
          component: ChartFilterCollapseInitializer,
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
  ],
};
