/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent } from '@nocobase/test/client';
import { FlowEngine, FlowModel, FlowEngineProvider, largeField } from '@nocobase/flow-engine';
import { SubTableColumnModel } from '../SubTableColumnModel';

const previewClicked = vi.fn();

class FakePreviewModel extends FlowModel {
  render() {
    return (
      <span>
        <div role="button" tabIndex={0} data-testid="thumb" onClick={previewClicked}>
          file.png
        </div>
        {createPortal(<div data-testid="portal">preview modal</div>, document.body)}
      </span>
    );
  }
}

@largeField()
class FakeUploadModel extends FlowModel {
  render() {
    return <div data-testid="uploader">uploader</div>;
  }
}

type CellRenderer = React.FC<Record<string, unknown>>;

function setup({
  disabled,
  fieldInterface = 'attachment',
  container,
}: {
  disabled: boolean;
  fieldInterface?: string;
  container?: HTMLElement;
}) {
  previewClicked.mockClear();
  const engine = new FlowEngine();
  engine.registerModels({ FakePreviewModel, FakeUploadModel });
  const open = vi.fn();
  engine.context.defineProperty('viewer', { value: { open } });

  const field = engine.createModel<FakeUploadModel>({ use: 'FakeUploadModel', uid: 'f1' });
  field.context.defineProperty('fieldPath', { value: 'items.files' });
  field.context.defineProperty('collectionField', { value: { interface: fieldInterface } });
  field.setSubModel('readPrettyField', { use: 'FakePreviewModel', uid: 'p1' });

  const column = Object.create(SubTableColumnModel.prototype);
  const ctx: Record<string, unknown> = {};
  ctx.defineProperty = (key: string, options: PropertyDescriptor) =>
    Object.defineProperty(ctx, key, { ...options, configurable: true });
  Object.defineProperties(column, {
    parent: {
      value: {
        context: { fieldIndex: [], collectionField: { name: 'items' } },
        collection: { filterTargetKey: 'id' },
        props: { value: [{ id: 1 }] },
      },
    },
    subModels: { value: { field } },
    props: { value: { disabled: false } },
    context: { value: { fieldIndex: [], t: (s: string) => s } },
    hasFormulaColumn: { value: false },
    hasFormValueDrivenDataScopeColumn: { value: false },
  });
  column.mapSubModels = (_key: string, fn: (m: FlowModel) => React.ReactNode) => [fn(field)];
  column.createFork = () => ({ context: ctx, uid: 'rowfork', flowEngine: undefined });
  column.createRowItemContextPropertyOptions = () => ({});

  const Cell: CellRenderer = SubTableColumnModel.prototype.renderItem.call(column);
  const utils = render(
    <FlowEngineProvider engine={engine}>
      <Cell value={[{ id: 1, url: '/file.png' }]} id={1} rowIdx={0} record={{ id: 1 }} disabled={disabled} />
    </FlowEngineProvider>,
    container ? { container } : undefined,
  );
  return { ...utils, open };
}

function getCellTrigger(element: HTMLElement) {
  return element.closest('div[style*="cursor"]') as HTMLElement;
}

describe('SubTableColumnModel large field cell', () => {
  it('previews the attachment instead of opening the editor when the thumbnail is clicked', async () => {
    const { findByTestId, open } = setup({ disabled: false });
    const thumb = await findByTestId('thumb');

    expect(thumb.closest('span[style*="pointer-events: none"]')).toBeNull();
    fireEvent.click(thumb);

    expect(previewClicked).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the editor when the editable cell itself is clicked', async () => {
    const { findByTestId, open, container } = setup({ disabled: false });
    const thumb = await findByTestId('thumb');

    expect(container.querySelector('.edit-icon')).not.toBeNull();
    fireEvent.click(getCellTrigger(thumb));

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('ignores clicks bubbling from portal content such as the preview modal', async () => {
    const { findByTestId, open } = setup({ disabled: false });
    fireEvent.click(await findByTestId('portal'));

    expect(open).not.toHaveBeenCalled();
  });

  it('still allows previewing but never editing when the cell is disabled', async () => {
    const { findByTestId, open, container } = setup({ disabled: true });
    const thumb = await findByTestId('thumb');
    const trigger = getCellTrigger(thumb);

    expect(trigger.style.cursor).toBe('default');
    expect(container.querySelector('.edit-icon')).toBeNull();

    fireEvent.click(thumb);
    fireEvent.click(trigger);

    expect(previewClicked).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('mounts the editor popover on body when the cell is rendered outside the app container (e.g. in a body-level modal)', async () => {
    const appContainer = document.createElement('div');
    appContainer.id = 'nocobase-app-container';
    document.body.appendChild(appContainer);
    try {
      const { findByTestId, open } = setup({ disabled: false });
      fireEvent.click(getCellTrigger(await findByTestId('thumb')));

      expect(open.mock.calls[0][0].getPopupContainer()).toBe(document.body);
    } finally {
      appContainer.remove();
    }
  });

  it('keeps the editor popover in the app container when the cell is rendered inside it', async () => {
    const appContainer = document.createElement('div');
    appContainer.id = 'nocobase-app-container';
    document.body.appendChild(appContainer);
    try {
      const { findByTestId, open } = setup({ disabled: false, container: appContainer });
      fireEvent.click(getCellTrigger(await findByTestId('thumb')));

      expect(open.mock.calls[0][0].getPopupContainer()).toBe(appContainer);
    } finally {
      appContainer.remove();
    }
  });

  it('keeps text-like large fields as a click-through placeholder that opens the editor', async () => {
    const { container, open } = setup({ disabled: false, fieldInterface: 'textarea' });
    const input = container.querySelector('input') as HTMLInputElement;

    expect(input.closest('span[style*="pointer-events: none"]')).not.toBeNull();
    fireEvent.click(getCellTrigger(input));

    expect(open).toHaveBeenCalledTimes(1);
  });
});
