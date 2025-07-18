/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { FormLayout, IFormLayoutProps } from '@formily/antd-v5';
import { Field, Form as FormilyForm, createForm, onFieldInit, onFormInputChange } from '@formily/core';
import { FieldContext, FormContext, observer, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { ConfigProvider, theme } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useActionContext } from '..';
import { useAttach, useComponent } from '../..';
import { useApp } from '../../../application';
import { getCardItemSchema } from '../../../block-provider';
import { useTemplateBlockContext } from '../../../block-provider/TemplateBlockProvider';
import { useDataBlockProps } from '../../../data-source';
import { useDataBlockRequest } from '../../../data-source/data-block/DataBlockRequestProvider';
import { useFlag } from '../../../flag-provider/hooks/useFlag';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { bindLinkageRulesToFiled } from '../../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { forEachLinkageRule } from '../../../schema-settings/LinkageRules/forEachLinkageRule';
import { useToken } from '../../../style';
import { useLocalVariables, useVariables } from '../../../variables';
import { useProps } from '../../hooks/useProps';
import { useFormBlockHeight } from './hook';

export interface FormProps extends IFormLayoutProps {
  form?: FormilyForm;
  disabled?: boolean;
}

const FormComponent: React.FC<FormProps> = (props) => {
  const { form, children, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  const cardItemSchema = getCardItemSchema?.(fieldSchema);
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const height = useFormBlockHeight();
  const { token } = theme.useToken();
  const {
    layout = 'vertical',
    labelAlign = 'left',
    labelWidth = 120,
    labelWrap = true,
    colon = true,
  } = cardItemSchema?.['x-component-props'] || {};
  const { isInFilterFormBlock } = useFlag();

  useEffect(() => {
    if (!isInFilterFormBlock) {
      return;
    }

    // Clear the form validators. Filter forms don't need validators.
    form.query('*').forEach((field: Field) => {
      if (field.validator) {
        field.validator = null;
      }
    });
  }, [form, isInFilterFormBlock]);

  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout
          layout={layout}
          {...others}
          labelAlign={labelAlign}
          labelWidth={layout === 'horizontal' ? labelWidth : null}
          labelWrap={labelWrap}
          colon={colon}
        >
          <div
            className={css`
              .nb-grid-container {
                height: ${height ? height + 'px' : '100%'};
                overflow-y: auto;
                margin-left: -${token.marginLG}px;
                margin-right: -${token.marginLG}px;
                padding-left: ${token.marginLG}px;
                padding-right: ${token.marginLG}px;
                .ant-formily-item-layout-horizontal {
                  .ant-formily-item-control {
                    max-width: calc(100% - ${labelWidth}px);
                  }
                }
              }
            `}
          >
            <NocoBaseRecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties isUseFormilyField />
          </div>
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
              <NocoBaseRecursionField
                basePath={f.address}
                schema={fieldSchema}
                onlyRenderProperties
                isUseFormilyField
              />
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
  const { templateFinished } = useTemplateBlockContext();
  const { loading, data } = useDataBlockRequest() || {};
  const app = useApp();
  const linkageRules: any[] =
    (getLinkageRules(fieldSchema) || fieldSchema.parent?.['x-linkage-rules'])?.filter((k) => !k.disabled) || [];

  // 关闭弹窗之前，如果有未保存的数据，是否要二次确认
  const { confirmBeforeClose = true, action } = useDataBlockProps() || ({} as any);
  const isCreateForm = action === undefined;

  useEffect(() => {
    const id = uid();

    form.addEffects(id, () => {
      onFormInputChange(() => {
        setFormValueChanged?.(confirmBeforeClose);
      });
    });

    if (props.disabled) {
      form.disabled = props.disabled;
    }

    return () => {
      form.removeEffects(id);
    };
  }, [form, props.disabled, setFormValueChanged, confirmBeforeClose]);

  useEffect(() => {
    if (loading || (!isCreateForm && _.isEmpty(data?.data))) {
      return;
    }

    const id = uid();
    const disposes = [];

    // 如果不延迟执行，那么一开始获取到的 form.values 的值是旧的，会导致详情区块的联动规则出现一些问题
    setTimeout(() => {
      form.addEffects(id, () => {
        forEachLinkageRule(linkageRules, (action, rule) => {
          if (action.targetFields?.length) {
            const fields = action.targetFields.join(',');

            // 之前使用的 `onFieldReact` 有问题，没有办法被取消监听，所以这里用 `onFieldInit` 和 `reaction` 代替
            onFieldInit(`*(${fields})`, (field: any, form) => {
              disposes.push(
                bindLinkageRulesToFiled(
                  {
                    field,
                    linkageRules,
                    formValues: form.values,
                    localVariables,
                    action,
                    rule,
                    variables,
                  },
                  app.jsonLogic,
                ),
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
  }, [linkageRules, templateFinished, loading, data?.data, isCreateForm]);

  return fieldSchema['x-decorator'] === 'FormV2' ? <FormDecorator {...props} /> : <FormComponent {...props} />;
};

const WithoutForm = (props) => {
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  // 关闭弹窗之前，如果有未保存的数据，是否要二次确认
  const { confirmBeforeClose = true } = useDataBlockProps() || ({} as any);
  const form = useMemo(
    () =>
      createForm({
        validateFirst: true,
        disabled: props.disabled,
        effects() {
          onFormInputChange((form) => {
            setFormValueChanged?.(confirmBeforeClose);
          });
        },
      }),
    [confirmBeforeClose],
  );
  return fieldSchema['x-decorator'] === 'FormV2' ? (
    <FormDecorator form={form} {...props} />
  ) : (
    <FormComponent form={form} {...props} />
  );
};

const formLayoutCss = css`
  .ant-formily-item-feedback-layout-loose {
    margin-bottom: 12px;
  }
`;

export const Form: React.FC<FormProps> & {
  Designer?: any;
  FilterDesigner?: any;
  ReadPrettyDesigner?: any;
  Templates?: any;
} = withDynamicSchemaProps(
  observer((props) => {
    const field = useField<Field>();
    const { token } = useToken();

    // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { form, disabled, ...others } = useProps(props);
    const theme: any = useMemo(() => {
      return {
        token: {
          // 这里是为了防止区块内部也收到 marginBlock 的影响（marginBlock：区块之间的间距）
          // @ts-ignore
          marginBlock: token.marginLG,
        },
      };
    }, [token.marginLG]);

    const formDisabled = disabled || field.disabled;
    return (
      <ConfigProvider componentDisabled={formDisabled} theme={theme}>
        <form onSubmit={(e) => e.preventDefault()} className={formLayoutCss}>
          {form ? (
            <WithForm form={form} {...others} disabled={formDisabled} />
          ) : (
            <WithoutForm {...others} disabled={formDisabled} />
          )}
        </form>
      </ConfigProvider>
    );
  }),
  { displayName: 'Form' },
);
