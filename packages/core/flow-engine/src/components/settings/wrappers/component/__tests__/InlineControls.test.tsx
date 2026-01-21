/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@nocobase/test/client';
import { FlowEngine, FlowEngineProvider } from '@nocobase/flow-engine';

import { SwitchWithTitle } from '../SwitchWithTitle';
import { SelectWithTitle } from '../SelectWithTitle';

vi.mock('antd', async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    Select: ({
      popupMatchSelectWidth,
      bordered,
      popupClassName,
      fieldNames,
      labelRender,
      optionRender,
      dropdownRender,
      options,
      ...props
    }: any) => React.createElement('select', props),
    Switch: ({ checkedChildren, unCheckedChildren, size, ...props }: any) =>
      React.createElement('input', { ...props, type: 'checkbox', readOnly: true }),
  };
});

describe('Inline controls - stopPropagation', () => {
  it('SwitchWithTitle click does not bubble to parent', async () => {
    const engine = new FlowEngine();
    const parentClick = vi.fn();
    const onChange = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <div onClick={parentClick}>
          <SwitchWithTitle title="Enabled" itemKey="enabled" onChange={onChange} />
        </div>
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Enabled'));

    expect(parentClick).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({ enabled: true });
  });

  it('SelectWithTitle click does not bubble to parent', async () => {
    const engine = new FlowEngine();
    const parentClick = vi.fn();

    render(
      <FlowEngineProvider engine={engine}>
        <div onClick={parentClick}>
          <SelectWithTitle title="Mode" itemKey="mode" options={[{ label: 'A', value: 'a' }]} />
        </div>
      </FlowEngineProvider>,
    );

    fireEvent.click(screen.getByText('Mode'));

    expect(parentClick).not.toHaveBeenCalled();
  });
});
