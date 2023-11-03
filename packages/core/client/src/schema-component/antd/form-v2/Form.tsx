import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import {
  createForm,
  Field,
  Form as FormilyForm,
  onFieldChange,
  onFieldInit,
  onFieldReact,
  onFormInputChange,
} from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { autorun } from '@formily/reactive';
import { uid } from '@formily/shared';
import { ConfigProvider, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useActionContext } from '..';
import { useAttach, useComponent } from '../..';
import { useLocalVariables, useVariables } from '../../../variables';
import { useProps } from '../../hooks/useProps';
import { linkageMergeAction } from './utils';

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
  }, [props.disabled]);

  useEffect(() => {
    const id = uid();
    const disposes = [];
    const linkagefields = [];

    form.addEffects(id, () => {
      linkageRules.forEach((v, index) => {
        v.actions?.forEach((h) => {
          if (h.targetFields?.length) {
            const fields = h.targetFields.join(',');
            onFieldInit(`*(${fields})`, (field: any, form) => {
              field['initProperty'] = field?.['initProperty'] ?? {
                display: field.display,
                required: field.required,
                pattern: field.pattern,
                value: field.value || field.initialValue,
              };
            });
            onFieldChange(`*(${fields})`, ['value', 'required', 'pattern', 'display'], (field: any) => {
              field.linkageProperty = {
                display: field.linkageProperty?.display,
              };
            });

            // `onFieldReact` 有问题，没有办法被取消监听，所以这里用 `onFieldInit` 代替
            onFieldInit(`*(${fields})`, (field: any, form) => {
              disposes.push(
                autorun(async () => {
                  linkagefields.push(field);
                  await linkageMergeAction({
                    operator: h.operator,
                    value: h.value,
                    field,
                    condition: v.condition,
                    values: form?.values,
                    variables,
                    localVariables,
                  });
                  // 如果是 linkageRules 数组的最后一个元素
                  if (index === linkageRules.length - 1) {
                    // 等待异步操作完成
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    // 清空 linkagefields 数组中对象的属性
                    linkagefields.forEach((v) => {
                      v.linkageProperty = {};
                    });
                    // 清空 linkagefields 数组
                    linkagefields.length = 0;
                  }
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
