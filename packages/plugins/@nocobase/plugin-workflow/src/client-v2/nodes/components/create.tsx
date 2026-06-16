/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Form } from 'antd';
import { useNodeContext } from '../../canvas/contexts';
import { AppendsSelect, AssignedFieldsEditor } from '../../components/collection';
import { useT } from '../../locale';
import { NodeCollectionField } from './collection';

function CreateFields() {
  const t = useT();
  const form = Form.useFormInstance();
  const collection = Form.useWatch(['config', 'collection']);

  useEffect(() => {
    if (collection) {
      form.setFieldValue(['config', 'usingAssignFormSchema'], true);
      if (!form.getFieldValue(['config', 'assignFormSchema'])) {
        form.setFieldValue(['config', 'assignFormSchema'], {});
      }
    }
  }, [collection, form]);

  return (
    <>
      <Form.Item
        name={['config', 'params', 'values']}
        label={t('Fields values')}
        extra={t(
          'Unassigned fields will be set to default values, and those without default values will be set to null.',
        )}
      >
        <AssignedFieldsEditor collection={collection} />
      </Form.Item>
      {collection ? (
        <Form.Item
          name={['config', 'params', 'appends']}
          label={t('Preload associations')}
          extra={t(
            'Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.',
          )}
        >
          <AppendsSelect collection={collection} />
        </Form.Item>
      ) : null}
    </>
  );
}

export function CreateFieldset() {
  const node = useNodeContext();
  const form = Form.useFormInstance();

  return (
    <>
      <NodeCollectionField
        disabled={Boolean(node?.config?.collection)}
        onCollectionChanged={() => {
          form.setFieldValue(['config', 'params'], {});
          form.setFieldValue(['config', 'assignFormSchema'], {});
        }}
      />
      <CreateFields />
    </>
  );
}

export function CreatePresetFieldset() {
  return <NodeCollectionField />;
}

export default CreateFieldset;
