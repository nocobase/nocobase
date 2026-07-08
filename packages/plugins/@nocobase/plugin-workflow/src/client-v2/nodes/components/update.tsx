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
import { useCurrentWorkflowContext, useNodeContext } from '../../canvas/contexts';
import { AssignedFieldsEditor, isAssociationField, type AssignedFieldFilter } from '../../components/collection';
import { RadioWithTooltip, type RadioWithTooltipOption } from '../../components/RadioWithTooltip';
import { useT } from '../../locale';
import { NodeCollectionField } from './collection';
import { NodeFilterField } from './filter';

const batchUpdateFieldFilter: AssignedFieldFilter = (field) => !isAssociationField(field) || field.type === 'belongsTo';

function useUpdateModeOptions(): RadioWithTooltipOption[] {
  const t = useT();

  return [
    {
      label: t('Update in a batch'),
      value: false,
      tooltip: t(
        'Update all eligible data at one time, which has better performance when the amount of data is large. But association fields are not supported (unless foreign key in current collection), and the updated data will not trigger other workflows.',
      ),
    },
    {
      label: t('Update one by one'),
      value: true,
      tooltip: t(
        'The updated data can trigger other workflows, and the audit log will also be recorded. But it is usually only applicable to several or dozens of pieces of data, otherwise there will be performance problems.',
      ),
    },
  ];
}

function UpdateFields() {
  const t = useT();
  const form = Form.useFormInstance();
  const workflow = useCurrentWorkflowContext();
  const collection = Form.useWatch(['config', 'collection']);
  const individualHooks = Form.useWatch(['config', 'params', 'individualHooks'], form);
  const updateModeOptions = useUpdateModeOptions();
  const isBatchUpdateMode = individualHooks !== true;
  const disabled = Boolean(workflow?.versionStats?.executed);

  useEffect(() => {
    if (!collection) {
      return;
    }
    form.setFieldValue(['config', 'usingAssignFormSchema'], undefined);
    form.setFieldValue(['config', 'assignFormSchema'], undefined);
    if (typeof form.getFieldValue(['config', 'params', 'individualHooks']) === 'undefined') {
      form.setFieldValue(['config', 'params', 'individualHooks'], false);
    }
  }, [collection, form]);

  if (!collection) {
    return null;
  }

  return (
    <>
      <Form.Item name={['config', 'params', 'individualHooks']} label={t('Update mode')}>
        <RadioWithTooltip options={updateModeOptions} />
      </Form.Item>

      <NodeFilterField collection={collection} label={t('Only update records matching conditions')} />

      <Form.Item name={['config', 'params', 'values']} label={t('Fields values')}>
        <AssignedFieldsEditor
          collection={collection}
          fieldFilter={isBatchUpdateMode ? batchUpdateFieldFilter : undefined}
          pruneFilteredValues={isBatchUpdateMode}
          disabled={disabled}
        />
      </Form.Item>
    </>
  );
}

export function UpdateFieldset() {
  const node = useNodeContext();
  const form = Form.useFormInstance();

  return (
    <>
      <NodeCollectionField
        disabled={Boolean(node?.config?.collection)}
        onCollectionChanged={() => {
          form.setFieldValue(['config', 'params', 'filter'], {});
          form.setFieldValue(['config', 'params', 'values'], {});
          form.setFieldValue(['config', 'usingAssignFormSchema'], undefined);
          form.setFieldValue(['config', 'assignFormSchema'], undefined);
        }}
      />
      <UpdateFields />
    </>
  );
}

export function UpdatePresetFieldset() {
  return <NodeCollectionField />;
}

export default UpdateFieldset;
