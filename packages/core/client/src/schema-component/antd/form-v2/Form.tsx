import { FormLayout } from '@formily/antd';
import { createForm, Field, onFormInputChange, onFieldReact, onFieldInit, onFieldChange } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { ConfigProvider, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useActionContext } from '..';
import { useAttach, useComponent } from '../..';
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

const WithForm = (props) => {
  const { form } = props;
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  const linkageRules = getLinkageRules(fieldSchema) || fieldSchema.parent?.['x-linkage-rules'] || [];
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      onFormInputChange((form) => {
        setFormValueChanged?.(true);
      });
    });
    form.disabled = props.disabled;
    return () => {
      form.removeEffects(id);
    };
  }, []);
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      return linkageRules.map((v) => {
        return v.actions?.map((h) => {
          if (h.targetFields) {
            const fields = h.targetFields.join(',');
            onFieldInit(`*(${fields})`, (field: any, form) => {
              field['initProperty'] = {
                display: field.display,
                required: field.required,
                pattern: field.pattern,
                value: field.value || field.initialValue,
              };
            });
            onFieldChange(`*(${fields})`, ['value', 'required', 'pattern', 'display'], (field: any) => {
              field.linkageProperty = {};
            });
          }
        });
      });
    });
    return () => {
      form.removeEffects(id);
    };
  }, []);
  useEffect(() => {
    const id = uid();
    form.addEffects(id, () => {
      const linkagefields = [];
      return linkageRules.map((v, index) => {
        return v.actions?.map((h) => {
          if (h.targetFields) {
            const fields = h.targetFields.join(',');
            return onFieldReact(`*(${fields})`, (field: any, form) => {
              linkagefields.push(field);
              linkageMergeAction(h, field, v.condition, form?.values);
              if (index === linkageRules.length - 1) {
                setTimeout(() =>
                  linkagefields.map((v) => {
                    v.linkageProperty = {};
                  }),
                );
              }
            });
          }
        });
      });
    });
    return () => {
      form.removeEffects(id);
    };
  }, [linkageRules]);
  return fieldSchema['x-decorator'] === 'Form' ? <FormDecorator {...props} /> : <FormComponent {...props} />;
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
  return fieldSchema['x-decorator'] === 'Form' ? (
    <FormDecorator form={form} {...props} />
  ) : (
    <FormComponent form={form} {...props} />
  );
};

export const Form: React.FC<FormProps> & { Designer?: any; ReadPrettyDesigner?: any } = observer((props) => {
  const field = useField<Field>();
  const { form, disabled, ...others } = useProps(props);
  const formDisabled = disabled || field.disabled;
  return (
    <ConfigProvider componentDisabled={formDisabled}>
      <form>
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
});
