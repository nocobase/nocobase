import React, { useState } from 'react';
import { Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';

import {
  CollectionProvider,
  createFormBlockSchema,
  FormBlockProvider,
  RecordProvider,
  SchemaInitializer,
  useCollectionManager,
  useCompile,
  useRecord
} from "@nocobase/client";

import { NAMESPACE } from "../../../locale";
import { JOB_STATUS } from '../../../constants';
import { findSchema, ManualFormType } from '../SchemaConfig';

function CreateFormBlockProvider(props) {
  const record = useRecord() ?? {};

  return (
    <CollectionProvider collection={props.collection}>
      <RecordProvider record={record}>
        <FormBlockProvider {...props} />
      </RecordProvider>
    </CollectionProvider>
  );
}

function CreateFormBlockInitializer({ insert, collection, ...props }) {
  function onConfirm() {
    const schema = createFormBlockSchema({
      title: `{{t("Create record", { ns: "${NAMESPACE}" })}}`,
      collection,
      actionInitializers: 'AddActionButton',
      actions: {
        resolve: {
          type: 'void',
          title: `{{t("Continue the process", { ns: "${NAMESPACE}" })}}`,
          'x-decorator': 'ManualActionStatusProvider',
          'x-decorator-props': {
            value: JOB_STATUS.RESOLVED
          },
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
            useAction: '{{ useSubmit }}',
          },
          'x-designer': 'Action.Designer',
          'x-action': `${JOB_STATUS.RESOLVED}`,
        }
      }
    });
    schema['x-decorator'] = 'CreateFormBlockProvider';
    insert(schema);
  }

  return (
    <SchemaInitializer.Item
      {...props}
      onClick={onConfirm}
    />
  );
}



export default {
  title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
  config: {
    useInitializer() {
      const { collections } = useCollectionManager();
      return {
        key: 'createRecordForm',
        type: 'subMenu',
        title: `{{t("Create record form", { ns: "${NAMESPACE}" })}}`,
        children: collections.map(item => ({
          key: item.name,
          type: 'item',
          title: item.title,
          collection: item.name,
          component: CreateFormBlockInitializer
        }))
      };
    },
    initializers: {
      // AddCustomFormField
    },
    components: {
      CreateFormBlockProvider
    },
    parseFormOptions(root) {
      const forms = {};
      const formBlocks: any[] = findSchema(root, item => item['x-decorator'] === 'CreateFormBlockProvider');
      formBlocks.forEach(formBlock => {
        const [formKey] = Object.keys(formBlock.properties);
        const formSchema = formBlock.properties[formKey];
        forms[formKey] = {
          type: 'create',
          title: formBlock['x-component-props']?.title || formKey,
          actions: findSchema(formSchema.properties.actions, item => item['x-component'] === 'Action')
            .map(item => item['x-decorator-props'].value),
          collection: formBlock['x-decorator-props'].collection
        };
      });
      return forms;
    }
  },
  block: {
    scope: {
      // useFormBlockProps
    },
    components: {
      CreateFormBlockProvider
    }
  }
} as ManualFormType;
