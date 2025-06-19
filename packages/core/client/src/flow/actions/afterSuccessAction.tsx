import { useGlobalVariable } from '../../application/hooks/useGlobalVariable';
import { BlocksSelector } from '../../schema-component/antd/action/Action.Designer';
import { useAfterSuccessOptions } from '../../schema-component/antd/action/hooks/useGetAfterSuccessVariablesOptions';

const fieldNames = {
  value: 'value',
  label: 'label',
};
const useVariableProps = () => {
  const environmentVariables = useGlobalVariable('$env');
  const scope = useAfterSuccessOptions();
  return {
    scope: [environmentVariables, ...scope].filter(Boolean),
    fieldNames,
  };
};

export const afterSuccessAction = {
  title: '提交成功后',
  uiSchema: {
    successMessage: {
      title: 'Popup message',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {},
    },
    manualClose: {
      title: 'Message popup close method',
      enum: [
        { label: 'Automatic close', value: false },
        { label: 'Manually close', value: true },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {},
    },
    redirecting: {
      title: 'Then',
      'x-hidden': true,
      enum: [
        { label: 'Stay on current page', value: false },
        { label: 'Redirect to', value: true },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {},
      'x-reactions': {
        target: 'redirectTo',
        fulfill: {
          state: {
            visible: '{{!!$self.value}}',
          },
        },
      },
    },
    actionAfterSuccess: {
      title: 'Action after successful submission',
      enum: [
        { label: 'Stay on the current popup or page', value: 'stay' },
        { label: 'Return to the previous popup or page', value: 'previous' },
        { label: 'Redirect to', value: 'redirect' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {},
      'x-reactions': {
        target: 'redirectTo',
        fulfill: {
          state: {
            visible: "{{$self.value==='redirect'}}",
          },
        },
      },
    },
    redirectTo: {
      title: 'Link',
      'x-decorator': 'FormItem',
      'x-component': 'Variable.TextArea',
      // eslint-disable-next-line react-hooks/rules-of-hooks
      'x-use-component-props': () => useVariableProps(),
    },
    blocksToRefresh: {
      type: 'array',
      title: 'Refresh data blocks',
      'x-decorator': 'FormItem',
      'x-use-decorator-props': () => {
        return {
          tooltip: 'After successful submission, the selected data blocks will be automatically refreshed.',
        };
      },
      'x-component': BlocksSelector,
      // 'x-hidden': isInBlockTemplateConfigPage, // 模板配置页面暂不支持该配置
    },
  },
  handler(ctx, params) {},
};
