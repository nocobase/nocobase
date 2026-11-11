/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource, observer } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Form, Input, Modal } from 'antd';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { EditFormModel } from '../EditFormModel';

it('keeps the visible page and edits on cancel and loads the next record on confirm', async () => {
  const records = [{ name: 'Record B' }, { name: 'Record A' }];
  const model = new EditFormModel({ uid: 'edit', flowEngine: new FlowEngine() });
  const resource = new MultiRecordResource(model.context);
  resource.setPage(1).setPageSize(1).setMeta({ count: 2, totalPage: 2 }).setData([records[0]]);
  model.context.defineProperty('resource', { value: resource });
  model.context.defineProperty('record', { get: () => model.getCurrentRecord() });
  const refresh = vi.spyOn(resource, 'refresh').mockImplementation(async () => {
    const record = records[resource.getPage() - 1];
    resource.setData([record]);
    model.form.setFieldsValue(record);
    model.resetUserModifiedFields();
    resource.loading = false;
  });
  const Editor = observer(() => {
    const [form] = Form.useForm();
    const [modal, dialogs] = Modal.useModal();
    model.context.defineProperty('form', { value: form });
    model.context.defineProperty('modal', { value: modal });
    const block = model.renderComponent();
    return (
      <>
        {dialogs}
        {React.cloneElement(block, {
          grid: (
            <Form.Item name="name" label="Name">
              <Input />
            </Form.Item>
          ),
          actions: null,
        })}
      </>
    );
  });

  const { container } = render(<Editor />);
  const field = screen.getByRole('textbox', { name: 'Name' });
  const pageInput = () => screen.getByRole('textbox', { name: 'Go to' });
  const nextPage = () => fireEvent.click(container.querySelector('.ant-pagination-next button'));
  expect(field).toHaveValue('Record B');
  fireEvent.change(field, { target: { value: 'unsaved draft' } });
  nextPage();
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('Unsaved changes');
  expect(pageInput()).toHaveValue('1');
  fireEvent.click(within(dialog).getByText('Cancel'));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(pageInput()).toHaveValue('1');
  expect(field).toHaveValue('unsaved draft');
  expect(refresh).not.toHaveBeenCalled();

  nextPage();
  fireEvent.click(within(await screen.findByRole('dialog')).getByText('Confirm'));
  await waitFor(() => expect(field).toHaveValue('Record A'));
  expect(pageInput()).toHaveValue('2');
  expect(refresh).toHaveBeenCalledTimes(1);

  fireEvent.click(container.querySelector('.ant-pagination-prev button'));
  await waitFor(() => expect(field).toHaveValue('Record B'));
  expect(pageInput()).toHaveValue('1');
});
