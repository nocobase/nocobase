/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ReadPrettyInternalTag } from '../InternalTag';
import { OpenModeProvider } from '../../../../modules/popup/OpenModeProvider';
import {
  CollectionRecordProvider,
  useCollectionRecordData,
} from '../../../../data-source/collection-record/CollectionRecordProvider';
import { useActionContext } from '../../action/hooks';
import { ActionContainer } from '../../action/Action.Container';

vi.mock('../hooks', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useFieldNames: () => ({ label: 'title', value: 'id' }),
  useAssociationFieldContext: () => ({ options: { target: 'roles', interface: 'm2m' } }),
  useInsertSchema: () => () => {},
}));
vi.mock('../util', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useLabelUiSchema: () => ({ 'x-component': 'Input' }),
}));
vi.mock('../../../../collection-manager', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCollectionManager_deprecated: () => ({ getCollection: () => ({}) }),
}));
vi.mock('../../../../data-source', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCollection: () => ({ dataSource: 'main', name: 'roles', getPrimaryKey: () => 'id' }),
  DataBlockProvider: ({ children }) => children,
}));
vi.mock('../../../', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePopupSettings: () => ({ isPopupVisibleControlledByURL: () => false }),
  useDesignable: () => ({ designable: false }),
}));
vi.mock('../../../hooks', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompile: () => (v) => v,
}));
vi.mock('../../../../formily/NocoBaseRecursionField', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  NocoBaseRecursionField: (await import('@formily/react')).RecursionField,
}));
vi.mock('../../page/pagePopupUtils', async (importOriginal) => {
  return {
    ...(await importOriginal<object>()),
    usePopupUtils: () => {
      const { setVisible } = useActionContext();
      return { visibleWithURL: false, setVisibleWithURL: () => {}, openPopup: () => setVisible(true) };
    },
  };
});

const roles = [
  { id: 11, title: 'Manager' },
  { id: 22, title: 'Editor' },
];
function DetailBody() {
  const record = useCollectionRecordData();
  return <div>Role detail {record?.id}</div>;
}

it.each([
  ['drawer', 'small', '.ant-drawer-content-wrapper', '30%'],
  ['modal', 'large', '.ant-modal', '80%'],
])('opens the selected Tag using %s %s', async (openMode, openSize, selector, width) => {
  const form = createForm({ values: { roles } });
  const SchemaField = createSchemaField({
    components: {
      Tag: ReadPrettyInternalTag,
      AssociationField: Object.assign(() => null, { Viewer: ActionContainer }),
      DetailBody,
    },
  });
  const field = {
    type: 'array',
    'x-component': 'Tag',
    'x-component-props': { openMode, openSize, enableLink: true },
    properties: {
      viewer: {
        type: 'void',
        'x-component': 'AssociationField.Viewer',
        properties: { detail: { type: 'void', 'x-component': 'DetailBody' } },
      },
    },
  };
  render(
    <FormProvider form={form}>
      <OpenModeProvider>
        <CollectionRecordProvider record={{ id: 9 }}>
          <SchemaField schema={{ type: 'object', properties: { roles: field } }} />
        </CollectionRecordProvider>
      </OpenModeProvider>
    </FormProvider>,
  );
  fireEvent.click(screen.getByText('Editor'));
  expect(await screen.findByText('Role detail 22')).toBeTruthy();
  await waitFor(() => expect((document.querySelector(selector) as HTMLElement).style.width).toBe(width));
});
