import React, { useContext } from 'react';
import {
  ActionContext,
  useBlockAssociationContext,
  useBlockRequestContext,
  useBlockResource,
  useActionContext,
  useTableBlockContext,
  useDesignable,
  useCollectionManager,
  CollectionFieldContext,
  useAPIClient,
  useResourceActionContext,
  AssociateTableSelectorContext,
  useRecord,
  useFilterByTk,
} from '@nocobase/client';
import { uid } from '@formily/shared';
import { useTranslation } from 'react-i18next';
import { useAssociateTableSelectorContext } from '../../block-provider/AssociateTableProvider';
import { useCollection } from '@nocobase/client';
import { ISchema, useForm, useField, Schema, useFieldSchema } from '@formily/react';
import { ActionInitializer } from './ActionInitializer';

function useAttachAction(props) {
  console.log(props);
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const ctx1 = useAssociateTableSelectorContext();
  const form = useForm();
  const api = useAPIClient();
  const ctx = useActionContext();
  console.log(ctx, ctx1);
  const field = useField();
  console.log(field);

  return {
    async run() {
      console.log(ctx1);
      ctx.setVisible(false);
      dn.refresh();
    },
  };

  // return {
  //   async run() {
  //     await form.submit();
  //     await api.resource('add', data.id).update({
  //       filterByTk: data.id,
  //       values: {
  //         title: form.values.title,
  //         config: form.values.config
  //       }
  //     });
  //     ctx.setVisible(false);
  //     refresh();
  //   },
  // };
}

// const usePickActionProps = () => {
//   const { setVisible } = useActionContext();
//   const filterByTk = useFilterByTk();
//   const { resource, service, block, __parent } = useBlockRequestContext();

//   const form = useForm();
//   console.log(console.log(useRecord()));
//   console.log(filterByTk, resource, service, block, __parent);
//   console.log(useAssociateTableSelectorContext())
//   console.log(useContext(RecordPickerContext))
//   return {
//     onClick() {
//       console.log('usePickActionProps', form.values);
//     },
//   };
// };
const usePickActionProps = () => {
  const { setVisible } = useActionContext();
  // const { multiple, selectedRows, onChange } = useContext(RecordPickerContext);
  // console.log(selectedRows)
  return {
    onClick() {
      // if (multiple) {
      //   onChange(selectedRows);
      // } else {
      //   onChange(selectedRows?.[0] || null);
      // }
      setVisible(false);
    },
  };
};
// const { multiple, selectedRows, onChange } = useContext(RecordPickerContext);
// return {
//   onClick() {
//     if (multiple) {
//       onChange(selectedRows);
//     } else {
//       onChange(selectedRows?.[0] || null);
//     }
//     setVisible(false);
//   },
// };
// };

export const AttachActionInitializer = (props) => {
  const { name } = useCollection();
  const ctx = useTableBlockContext();
  const ctx1 = useContext(CollectionFieldContext);
  const ctx2 = useBlockResource();
  const association = useBlockAssociationContext();
  const schema1 = useFieldSchema();
  console.log(useContext(AssociateTableSelectorContext));

  const { getCollectionJoinField, getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(name);
  console.log(fields);

  const schema: ISchema = {
    type: 'void',
    title: '{{ t("Attach") }}',
    'x-action': 'attach',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      icon: 'LinkOutlined',
      openMode: 'drawer',
      // useProps: '{{ useTableFieldProps }}',
    },
    'x-acl-action-props': {
      skipScopeCheck: true,
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Select record") }}',
        version: '2.0',
        'x-component': 'RecordPicker.Selector',
        'x-component-props': {
          className: 'nb-record-picker-selector',
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'AssociateTableInitializers',
            'x-initializer-props': {
              association,
            },
            'x-decorator-props': {
              association,
            },
          },
          footer: {
            'x-component': 'Action.Container.Footer',
            'x-component-props': {},
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-component-props': {},
                properties: {
                  submit: {
                    title: '{{ t("Submit") }}',
                    'x-action': 'submit',
                    'x-component': 'Action',
                    'x-designer': 'Action.Designer',
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                      useProps: '{{ usePickActionProps }}',
                      // useAction: useAttachAction,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return <ActionInitializer {...props} schema={schema} />;
};
