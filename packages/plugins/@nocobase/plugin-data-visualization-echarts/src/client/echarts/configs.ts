import { lang } from '../locale';

export default {
  showLegend: {
    configType: 'boolean',
    name: 'showLegend',
    title: lang('Show legend'),
    defaultValue: true,
  },
  legendOrient: {
    configType: 'select',
    name: 'legendOrient',
    title: lang('Legend orient'),
    defaultValue: 'horizontal',
    options: [
      {
        label: lang('Horizontal'),
        value: 'horizontal',
      },
      {
        label: lang('Vertical'),
        value: 'vertical',
      },
    ],
  },
  legendPosition: {
    legendPosition: {
      title: lang('Legend position (left, bottom, right, top)'),
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        left: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: lang('Left'),
            allowClear: false,
          },
        },
        bottom: {
          'x-component': 'Input',
          'x-component-props': {
            allowClear: false,
            placeholder: lang('Bottom'),
          },
        },
        right: {
          'x-component': 'Input',
          'x-component-props': {
            allowClear: false,
            placeholder: lang('Right'),
          },
        },
        top: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: lang('Top'),
            allowClear: false,
          },
        },
      },
    },
  },
  showLabel: {
    configType: 'boolean',
    name: 'showLabel',
    title: lang('Show label'),
    defaultValue: true,
  },
  labelType: (options?: { defaultValue: string }) => {
    const { defaultValue = 1 } = options || {};
    return {
      labelType: {
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        name: 'labelType',
        title: lang('Label type'),
        default: defaultValue,
        enum: [
          { label: lang('Value'), value: 1 },
          { label: lang('Category name'), value: 2 },
          { label: `${lang('Category name')} + ${lang('Value')}`, value: 3 },
          { label: lang('Hidden'), value: 0 },
        ],
      },
    };
  },
  splitLine: (options?: { defaultValue: string }) => {
    const { defaultValue = 'y' } = options || {};
    return {
      splitLine: {
        title: lang('Split line'),
        type: 'object',
        'x-decorator': 'FormItem',
        'x-component': 'Space',
        properties: {
          type: {
            'x-component': 'Select',
            'x-component-props': {
              allowClear: false,
            },
            default: defaultValue,
            enum: [
              {
                label: lang('Only x-axis'),
                value: 'x',
              },
              {
                label: lang('Only y-axis'),
                value: 'y',
              },
              {
                label: lang('Both x and y-axis'),
                value: 'xy',
              },
              {
                label: lang('None'),
                value: 'none',
              },
            ],
          },
          style: {
            'x-component': 'Select',
            'x-component-props': {
              allowClear: false,
            },
            default: 'dashed',
            enum: [
              {
                label: '------',
                value: 'dashed',
              },
              {
                label: '······',
                value: 'dotted',
              },
              {
                label: '———',
                value: 'solid',
              },
            ],
          },
        },
      },
    };
  },
  markLine: {
    markLine: {
      title: lang('Mark line'),
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'object',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              name: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: lang('Title'),
                },
                required: true,
              },
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {
                  placeholder: lang('Value'),
                },
                required: true,
              },
              color: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'ColorPicker',
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: '{{t("Add")}}',
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
  },
  axisTitle: (options?: { name: string; title: string; defaultValue: string }) => {
    const { name, title, defaultValue = 'start' } = options || {};
    return {
      [name]: {
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        name,
        title,
        default: defaultValue,
        enum: [
          { label: lang('Start'), value: 'start' },
          { label: lang('Middle'), value: 'middle' },
          { label: lang('End'), value: 'end' },
          { label: lang('None'), value: 'none' },
        ],
      },
    };
  },
  padding: {
    padding: {
      title: lang('Padding (left, bottom, right, top)'),
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        left: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: lang('Left'),
            allowClear: false,
          },
        },
        bottom: {
          'x-component': 'Input',
          'x-component-props': {
            allowClear: false,
            placeholder: lang('Bottom'),
          },
        },
        right: {
          'x-component': 'Input',
          'x-component-props': {
            allowClear: false,
            placeholder: lang('Right'),
          },
        },
        top: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: lang('Top'),
            allowClear: false,
          },
        },
      },
    },
  },
  axisLabelRotate: (options?: { name: string; title: string; defaultValue: string }) => {
    const { name, title, defaultValue = 0 } = options || {};
    return {
      [name]: {
        title,
        type: 'number',
        default: defaultValue,
        'x-decorator': 'FormItem',
        'x-component': 'Slider',
        'x-component-props': {
          min: -90,
          max: 90,
        },
      },
    };
  },
  barWidth: {
    barWidth: {
      title: lang('Bar width (min, max)'),
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        min: {
          'x-component': 'Input',
          'x-component-props': {
            placeholder: lang('Min'),
            allowClear: false,
          },
        },
        max: {
          'x-component': 'Input',
          'x-component-props': {
            allowClear: false,
            placeholder: lang('Max'),
          },
        },
      },
    },
  },
  barGap: {
    barGap: {
      title: lang('Bar gap'),
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        suffix: '%',
      },
    },
  },
  colors: {
    colors: {
      title: lang('Colors'),
      type: 'array',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'void',
        'x-component': 'Space',
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          color: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'ColorPicker',
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: '{{t("Add")}}',
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
  },
};
