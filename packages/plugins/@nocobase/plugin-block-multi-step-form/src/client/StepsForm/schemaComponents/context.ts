import React, { createContext, useContext, useState } from 'react';
import { Form } from '@formily/core';
import { useFieldSchema } from '@formily/react';
import {
  css,
  useDesignable,
  withDynamicSchemaProps,
  useDataBlockResource,
  useResource,
  useParamsFromRecord,
  useFilterByTk,
  useFormActiveFields,
  useActionContext,
  useFormBlockProps,
} from '@nocobase/client';
import { getStepsFormStepSchema } from '../addBlock/blockSchema';
import { App } from 'antd';
import { useT } from '../../locale';
import _ from 'lodash';
import { deepFind, deepGetParents } from './utils';

type StepsFormContextProps = {
  isEdit: boolean;
  form: Form;
  items: Array<{
    title: string;
    contentSchema: any;
    uid: string;
    name: string;
    index?: number;
  }>;
  /** 当前步骤，从0开始 */
  currentStep: number;
  /** 总页数 */
  stepsCount: number;
  /** 设置当前步骤 */
  setCurrentStep: (currentStep: number) => void;
  /** 添加步骤 */
  addStep: () => void;
  /** 下一页 */
  nextStep: () => void;
  /** 上一页 */
  previousStep: () => void;
  /** 提交 */
  submit: () => void;
  /** 注册当前表单实例 */
  registerFormInstance: (params: { uid: string; form: Form }) => void;
  /** 删除某个步骤 */
  deleteStep: (name: string) => void;
  /** 变更步骤标标题 */
  changeStepTitle: (name: string, newTitle: string) => void;
  /**
   * 拖动排序
   * @param activeIndex 需要拖的步骤index
   * @param overIndex 放置的步骤index
   * @returns void
   */
  stepDragEnd: (activeIndex: number, overIndex: number) => void;
};

export const StepsFormContext = createContext<StepsFormContextProps>(null as any);

export function useStepsContext(props) {
  const { collection, dataSource, isEdit } = props;
  const schema = useFieldSchema();
  const [currentStep, setCurrentStep] = useState(0);
  const { designable, insertBeforeEnd, dn } = useDesignable();
  const { message, modal } = App.useApp();
  const resource = useResource(collection);
  const t = useT();
  const { setVisible, setSubmitted, setFormValueChanged } = useActionContext();
  const { form } = useFormBlockProps();

  // TODO 暂不处理多表单实例的情况
  // const { getCurrentFormInstance, registerFormInstance } = useFormRef();
  const getCurrentFormInstance = (v: string) => {
    return form;
  };
  const registerFormInstance = () => {
    return null;
  };

  let items: Array<any> = schema.reduceProperties((buf, s, index) => {
    if (s['x-component'].includes('StepsForm.Step')) {
      // 目前在 packages/core/client/src/schema-component/antd/form-v2/Form.tsx 不支持获取多层的fieldSchema.parent?.['x-linkage-rules']，临时此处进行处理
      s['x-linkage-rules'] = schema.parent?.['x-linkage-rules'];
      buf.push({
        title: s['x-component-props']?.title || s.title,
        contentSchema: s,
        uid: s['x-component-props']?.uid,
        name: s.name,
        index: s['x-component-props']?.index,
      });
    }
    return buf;
  }, [] as any);
  items = _.sortBy(items, ['index']);
  const stepsCount = items.length;

  const addStep = () => {
    insertBeforeEnd(
      getStepsFormStepSchema({
        title: `${t('Step')} ${stepsCount + 1}`,
        collection,
        dataSource,
        isEdit,
      }),
    );
  };

  const nextStep = async () => {
    // const currentForm = getCurrentFormInstance(items[currentStep].uid);
    const contentSchema = items[currentStep].contentSchema;
    try {
      // 获取当前step内表单字段地址
      const filedNames = deepFind(contentSchema, (x) => x['x-component'] === 'CollectionField').map((x) => {
        const parents = deepGetParents(x, (f) => f === contentSchema);
        return parents.map((x) => x.name).join('.');
      });
      // 获取需要校验的字段
      const neddValidateFields = form
        .query('*')
        .map((f) => f)
        .filter((f) => {
          return filedNames?.includes(f?.address?.entire);
        });
      // 字段校验
      await Promise.all(neddValidateFields.map((x) => x.validate?.()));
      setCurrentStep(currentStep === stepsCount - 1 ? currentStep : currentStep + 1);
    } catch (e) {
      console.error(e);
      message.warning(e[0]?.messages?.[0] || 'Unknow error');
    }
  };

  const previousStep = async () => {
    // const currentForm = getCurrentFormInstance(items[currentStep].uid);
    // try {
    //   await currentForm?.validate();
    // } catch (e) {
    //   message.warning(e[0]?.messages?.[0] || 'Unknow error');
    // }
    setCurrentStep(currentStep === 0 ? 0 : currentStep - 1);
  };

  const submit = async () => {
    // await onClick();
    // const form = getCurrentFormInstance(items[currentStep].uid);
    // await form.submit();
    // const values = form.values;
    // if (isEdit) {
    //   await resource.update({ filterByTk: values.id, values });
    //   message.success(t('Edited successfully'));
    // } else {
    //   await resource.create({ values });
    //   await form.reset();
    //   message.success(t('Created successfully'));
    // }
    // setSubmitted?.(true);
    // setVisible?.(false);
    // setFormValueChanged?.(false);
  };

  const deleteStep = (name) => {
    if (items.length === 1) {
      message.warning(t('The last step cannot be deleted'));
      return;
    }
    modal.confirm({
      title: t('Delete'),
      content: t('Whether to delete this step'),
      onOk: () => {
        dn.remove(schema.properties?.[name]);
      },
    });
  };

  const changeStepTitle = (name, newTitle) => {
    const fieldSchema = schema.properties?.[name];
    const componentProps = fieldSchema['x-component-props'] || {};
    componentProps.title = newTitle;
    fieldSchema['x-component-props'] = componentProps;
    dn.emit('patch', {
      schema: {
        ['x-uid']: fieldSchema['x-uid'],
        'x-component-props': fieldSchema['x-component-props'],
      },
    });
    dn.refresh();
  };

  const stepDragEnd = (activeIndex, overIndex) => {
    if (!Number.isInteger(activeIndex) || !Number.isInteger(overIndex)) {
      return;
    }
    if (activeIndex === overIndex || activeIndex < 0 || overIndex < 0) {
      return;
    }
    const active = items.splice(activeIndex, 1)[0];
    // 往后拖，放目标的后面
    if (activeIndex < overIndex) {
      items.splice(overIndex, 0, active);
    } else {
      // 往前拖，放目标的前面
      if (overIndex === 0) {
        items.unshift(active);
      } else {
        items.splice(overIndex, 0, active);
      }
    }
    items.forEach((x, index) => {
      schema.properties[x.name]['x-index'] = index + 200;
      schema.properties[x.name]['x-component-props'].index = index + 200; // TODO 接口返回的x-index和数据库不一致，后续可直接通过x-index实现
    });

    dn.emit('batchPatch', {
      schemas: items.map((x) => {
        const fieldSchema = schema.properties[x.name];
        return {
          'x-uid': fieldSchema['x-uid'],
          'x-index': fieldSchema['x-index'],
          'x-component-props': {
            ...fieldSchema['x-component-props'],
            index: fieldSchema['x-index'],
          },
        };
      }),
    });
    dn.refresh({ refreshParentSchema: true });
  };

  return {
    isEdit,
    form,
    items,
    currentStep,
    stepsCount,
    setCurrentStep,
    addStep,
    nextStep,
    previousStep,
    registerFormInstance,
    submit,
    deleteStep,
    changeStepTitle,
    stepDragEnd,
  };
}

export const useStepsFormContext = () => {
  return useContext(StepsFormContext);
};
