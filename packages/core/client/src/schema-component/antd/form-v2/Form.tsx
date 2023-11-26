import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm, Field, Form as FormilyForm, onFieldInit, onFormInputChange } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { autorun, toJS } from '@formily/reactive';
import { uid } from '@formily/shared';
import { ConfigProvider, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useActionContext } from '..';
import { useAttach, useComponent } from '../..';
import { ActionType } from '../../../schema-settings/LinkageRules/type';
import { useLocalVariables, useVariables } from '../../../variables';
import { useProps } from '../../hooks/useProps';
import { collectFieldStateOfLinkageRules, getTempFieldState } from './utils';

export interface FormProps {
  [key: string]: any;
}

const FormComponent: React.FC<FormProps> = (props) => {
  const { form, children, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const Def = (props: any) => props.children;

const FormDecorator: React.FC<FormProps> = (props) => {
  const { form, children, disabled, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const Component = useComponent(fieldSchema['x-component'], Def);
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <FieldContext.Provider value={f}>
            <Component {...field.componentProps}>
              <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
            </Component>
          </FieldContext.Provider>
          {/* <FieldContext.Provider value={f}>{children}</FieldContext.Provider> */}
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const getLinkageRules = (fieldSchema) => {
  let linkageRules = null;
  fieldSchema.mapProperties((schema) => {
    if (schema['x-linkage-rules']) {
      linkageRules = schema['x-linkage-rules'];
    }
  });
  return linkageRules;
};

interface WithFormProps {
  form: FormilyForm;
  disabled?: boolean;
}

const WithForm = (props: WithFormProps) => {
  const { form } = props;
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const linkageRules: any[] =
    (getLinkageRules(fieldSchema) || fieldSchema.parent?.['x-linkage-rules'])?.filter((k) => !k.disabled) || [];

  useEffect(() => {
    const id = uid();

    form.addEffects(id, () => {
      onFormInputChange(() => {
        setFormValueChanged?.(true);
      });
    });

    if (props.disabled) {
      form.disabled = props.disabled;
    }

    return () => {
      form.removeEffects(id);
    };
  }, [form, props.disabled, setFormValueChanged]);

  useEffect(() => {
    const id = uid();
    const disposes = [];

    form.addEffects(id, () => {
      linkageRules.forEach((v, index) => {
        v.actions?.forEach((h) => {
          if (h.targetFields?.length) {
            const fields = h.targetFields.join(',');
            onFieldInit(`*(${fields})`, (field: any, form) => {
              field['initProperty'] = field?.['initProperty'] ?? {
                display: getTempFieldState(true, field.display),
                required: getTempFieldState(true, field.required),
                pattern: getTempFieldState(true, field.pattern),
                value: getTempFieldState(true, field.value || field.initialValue),
              };
            });

            // 之前使用的 `onFieldReact` 有问题，没有办法被取消监听，所以这里用 `onFieldInit` 和 `autorun` 代替
            onFieldInit(`*(${fields})`, (field: any, form) => {
              disposes.push(
                autorun(() => {
                  console.log(1212);
                  // 当条件改变触发 autorun 时，会同步收集字段状态，并保存到 field.linkageProperty 中
                  collectFieldStateOfLinkageRules({
                    operator: h.operator,
                    value: h.value,
                    field,
                    condition: v.condition,
                    values: toJS(form?.values),
                    variables,
                    localVariables,
                  });

                  // 当条件改变时，有可能会触发多个 autorun，所以这里需要延迟一下，确保所有的 autorun 都执行完毕后，
                  // 再从 field.linkageProperty 中取值，因为此时 field.linkageProperty 中的值才是全的。
                  setTimeout(async () => {
                    const fieldName = getFieldNameByOperator(h.operator);

                    // 防止重复赋值
                    if (!field.linkageProperty[fieldName]) {
                      return;
                    }

                    let stateList = field.linkageProperty[fieldName];

                    stateList = await Promise.all(stateList);
                    stateList = stateList.filter((v) => v.condition);

                    const lastState = stateList[stateList.length - 1];

                    if (fieldName === 'value') {
                      // value 比较特殊，它只有在匹配条件时才需要赋值，当条件不匹配时，维持现在的值；
                      // stateList 中肯定会有一个初始值，所以当 stateList.length > 1 时，就说明有匹配条件的情况；
                      if (stateList.length > 1) {
                        field.value = lastState.value;
                      }
                    } else {
                      field[fieldName] = lastState?.value;
                    }

                    // 在这里清空 field.linkageProperty，就可以保证：当条件再次改变时，如果该字段没有和任何条件匹配，则需要把对应的值恢复到初始值；
                    field.linkageProperty[fieldName] = null;
                  });
                }),
              );
            });
          }
        });
      });
    });

    return () => {
      form.removeEffects(id);
      disposes.forEach((dispose) => {
        dispose();
      });
    };
  }, [linkageRules]);

  return fieldSchema['x-decorator'] === 'FormV2' ? <FormDecorator {...props} /> : <FormComponent {...props} />;
};

const WithoutForm = (props) => {
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  const form = useMemo(
    () =>
      createForm({
        disabled: props.disabled,
        effects() {
          onFormInputChange((form) => {
            setFormValueChanged?.(true);
          });
        },
      }),
    [],
  );
  return fieldSchema['x-decorator'] === 'FormV2' ? (
    <FormDecorator form={form} {...props} />
  ) : (
    <FormComponent form={form} {...props} />
  );
};

export const Form: React.FC<FormProps> & {
  Designer?: any;
  FilterDesigner?: any;
  ReadPrettyDesigner?: any;
  Templates?: any;
} = observer(
  (props) => {
    const field = useField<Field>();
    const { form, disabled, ...others } = useProps(props);
    const formDisabled = disabled || field.disabled;
    return (
      <ConfigProvider componentDisabled={formDisabled}>
        <form
          className={css`
            .ant-formily-item-feedback-layout-loose {
              margin-bottom: 12px;
            }
          `}
        >
          <Spin spinning={field.loading || false}>
            {form ? (
              <WithForm form={form} {...others} disabled={formDisabled} />
            ) : (
              <WithoutForm {...others} disabled={formDisabled} />
            )}
          </Spin>
        </form>
      </ConfigProvider>
    );
  },
  { displayName: 'Form' },
);

function getFieldNameByOperator(operator: ActionType) {
  switch (operator) {
    case ActionType.Required:
    case ActionType.InRequired:
      return 'required';
    case ActionType.Visible:
    case ActionType.None:
    case ActionType.Hidden:
      return 'display';
    case ActionType.Editable:
    case ActionType.ReadOnly:
    case ActionType.ReadPretty:
      return 'pattern';
    case ActionType.Value:
      return 'value';
    default:
      return null;
  }
}
