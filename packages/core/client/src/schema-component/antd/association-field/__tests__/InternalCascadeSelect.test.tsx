/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider, useField, useFieldSchema } from '@formily/react';
import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InternalCascadeSelect } from '../InternalCascadeSelect';

const mocks = vi.hoisted(() => ({
  associationFieldContext: undefined,
  dataBlockRequest: { loading: false, data: { data: {} } },
  resourceList: vi.fn(),
}));

vi.mock('../hooks', () => ({
  default: () => ({ params: {} }),
  useAssociationFieldContext: () => mocks.associationFieldContext,
}));

vi.mock('../../../', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAPIClient: () => ({
      resource: () => ({
        list: mocks.resourceList,
      }),
    }),
    useCollectionManager_deprecated: () => ({
      getCollectionJoinField: () => null,
      getInterface: () => ({ filterable: { operators: [{ value: '$includes' }] } }),
    }),
  };
});

vi.mock('../../../data-source', () => ({
  useDataBlockRequest: () => mocks.dataBlockRequest,
}));

const collectionField = {
  interface: 'm2o',
  target: 'orgs',
};

const orgValue = {
  id: 3,
  parentId: 2,
  parent: {
    id: 2,
    parentId: 1,
    parent: {
      id: 1,
      parentId: null,
    },
  },
};

const TestCascadeSelect = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();

  mocks.associationFieldContext = {
    options: collectionField,
    field,
    fieldSchema,
    currentMode: 'CascadeSelect',
  };

  return <InternalCascadeSelect {...props} />;
};

const SchemaField = createSchemaField({
  components: {
    FormItem,
    TestCascadeSelect,
  },
});

const schema = {
  type: 'object',
  properties: {
    org_m2o_tree: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'TestCascadeSelect',
      'x-component-props': {
        fieldNames: {
          value: 'id',
          label: 'id',
        },
        mode: 'CascadeSelect',
      },
    },
  },
};

describe('InternalCascadeSelect', () => {
  beforeEach(() => {
    mocks.associationFieldContext = undefined;
    mocks.dataBlockRequest = { loading: false, data: { data: {} } };
    mocks.resourceList.mockReset();
    mocks.resourceList.mockResolvedValue({
      data: {
        data: [],
      },
    });
  });

  it('syncs m2o value from the outer form when request data does not include the field yet', async () => {
    const form = createForm();

    render(
      <FormProvider form={form}>
        <SchemaField schema={schema} />
      </FormProvider>,
    );

    form.setValuesIn('org_m2o_tree', orgValue);

    await waitFor(() => {
      expect(screen.getByText('1', { selector: '.ant-select-selection-item' })).toBeInTheDocument();
      expect(screen.getByText('2', { selector: '.ant-select-selection-item' })).toBeInTheDocument();
      expect(screen.getByText('3', { selector: '.ant-select-selection-item' })).toBeInTheDocument();
    });
  });

  it('keeps m2o form value as the selected record instead of the cascade path array', async () => {
    mocks.dataBlockRequest = { loading: false, data: { data: { org_m2o_tree: null } } };
    mocks.resourceList.mockResolvedValue({
      data: {
        data: [
          { id: 1, parentId: null },
          { id: 2, parentId: null },
        ],
      },
    });
    const form = createForm();

    render(
      <FormProvider form={form}>
        <SchemaField schema={schema} />
      </FormProvider>,
    );

    await userEvent.click(document.querySelector('.ant-select-selector'));
    await userEvent.click(await screen.findByText('2', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => {
      expect(Array.isArray(form.values.org_m2o_tree)).toBe(false);
      expect(form.values.org_m2o_tree).toMatchObject({ id: 2, parentId: null });
    });
  });

  it('keeps the next cascade level available after selecting an m2o parent option', async () => {
    mocks.dataBlockRequest = { loading: false, data: { data: { org_m2o_tree: null } } };
    mocks.resourceList.mockImplementation(({ filter }) => {
      const parentFilter = Array.isArray(filter?.$and)
        ? filter.$and.find((item) => item && Object.prototype.hasOwnProperty.call(item, 'parentId'))
        : filter;
      const parentId = parentFilter?.parentId;
      const data =
        parentId === undefined ? [{ id: 1, parentId: null }] : parentId === 1 ? [{ id: 2, parentId: 1 }] : [];

      return Promise.resolve({
        data: {
          data,
        },
      });
    });
    const form = createForm();

    render(
      <FormProvider form={form}>
        <SchemaField schema={schema} />
      </FormProvider>,
    );

    await userEvent.click(document.querySelector('.ant-select-selector'));
    await userEvent.click(await screen.findByText('1', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => {
      expect(Array.isArray(form.values.org_m2o_tree)).toBe(false);
      expect(form.values.org_m2o_tree).toMatchObject({ id: 1, parentId: null });
    });

    await waitFor(() => {
      expect(document.querySelectorAll('.ant-select-selector')).toHaveLength(2);
    });

    await userEvent.click(document.querySelectorAll('.ant-select-selector')[1]);
    await userEvent.click(await screen.findByText('2', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => {
      expect(Array.isArray(form.values.org_m2o_tree)).toBe(false);
      expect(form.values.org_m2o_tree).toMatchObject({ id: 2, parentId: 1 });
    });
  });
});
