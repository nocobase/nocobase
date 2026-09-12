/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowContextProvider, type MetaTreeNode } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TypedVariableInput } from '../TypedVariableInput';

function createContextWithEnv() {
  const ctx = new FlowContext();
  (ctx as any).t = (key: string) => key;

  ctx.defineProperty('$env', {
    value: { SMTP_PORT: 465, SECURE_FLAG: true },
    meta: {
      title: 'Env',
      type: 'object',
      properties: {
        SMTP_PORT: { title: 'SMTP Port', type: 'number' },
        SECURE_FLAG: { title: 'Secure flag', type: 'boolean' },
      },
    },
  });

  return ctx;
}

function renderWithCtx(ctx: FlowContext, node: React.ReactNode) {
  return render(<FlowContextProvider context={ctx}>{node}</FlowContextProvider>);
}

describe('TypedVariableInput - constant rendering', () => {
  it('renders an InputNumber for a numeric value when types=[number]', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={465}
        types={[['number', { min: 1, max: 65535 }]]}
        namespaces={['$env']}
        onChange={() => undefined}
      />,
    );
    const numberInput = await screen.findByDisplayValue('465');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.getAttribute('role')).toBe('spinbutton');
  });

  it('renders a boolean Select when value is true and types=[boolean]', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={true} types={['boolean']} namespaces={['$env']} onChange={() => undefined} />,
    );
    await waitFor(() => {
      // antd Select renders the chosen item label via a selection-item span
      const item = screen.getByText('True');
      expect(item).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'variable-switcher' }).className).not.toContain('ant-btn-primary');
  });

  it('renders the Null placeholder when value=null and nullable=true', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={null} types={['number']} namespaces={['$env']} nullable onChange={() => undefined} />,
    );
    // Uses placeholder slot (not value) so antd's grey placeholder colour
    // applies — see comment in TypedVariableInput.tsx.
    const nullInput = await screen.findByPlaceholderText('<Null>');
    expect(nullInput).toBeInTheDocument();
    expect(nullInput.getAttribute('readonly')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'variable-switcher' }).className).not.toContain('ant-btn-primary');
  });

  it('keeps the number editor usable when value=null and nullable=false', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={null}
        types={[['number', { min: 1 }]]}
        namespaces={['$env']}
        nullable={false}
        onChange={handleChange}
      />,
    );

    const numberInput = await screen.findByRole('spinbutton');
    expect(screen.queryByPlaceholderText('<Null>')).toBeNull();
    fireEvent.change(numberInput, { target: { value: '2' } });
    fireEvent.blur(numberInput);
    expect(handleChange).toHaveBeenCalledWith(2);
  });

  it('defaults undefined to the first constant type', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={undefined}
        types={['string', 'number']}
        namespaces={['$env']}
        nullable
        onChange={handleChange}
      />,
    );

    expect(screen.queryByPlaceholderText('<Null>')).toBeNull();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('');
    });
  });

  it('uses a positive numeric minimum as the default value', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={undefined}
        types={[['number', { min: 1 }]]}
        namespaces={['$env']}
        nullable={false}
        onChange={handleChange}
      />,
    );

    expect(await screen.findByDisplayValue('1')).toBeInTheDocument();
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(1);
    });
  });

  it('can still opt out to keep the null placeholder for undefined', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={undefined}
        types={['string', 'number']}
        namespaces={['$env']}
        nullable
        defaultToFirstConstantTypeWhenUndefined={false}
        onChange={() => undefined}
      />,
    );

    const nullInput = await screen.findByPlaceholderText('<Null>');
    expect(nullInput).toBeInTheDocument();
  });

  it('highlights the defaulted first constant type when the switcher opens', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={undefined}
        types={['string', 'number']}
        namespaces={['$env']}
        nullable
        onChange={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));

    await waitFor(() => {
      const constant = screen.getAllByText('Constant')[0];
      const string = screen.getAllByText('String')[0];
      expect(constant.closest('.ant-cascader-menu-item-active')).not.toBeNull();
      expect(string.closest('.ant-cascader-menu-item-active')).not.toBeNull();
    });
  });
});

describe('TypedVariableInput - variable rendering', () => {
  it('renders a labelled pill when value is a {{ $env.X }} expression', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={['number']}
        namespaces={['$env']}
        onChange={() => undefined}
      />,
    );
    await waitFor(() => {
      const tag = screen.getByRole('button', { name: 'variable-tag' });
      expect(tag.textContent).toContain('Env');
      expect(tag.textContent).toContain('SMTP Port');
    });
  });

  it('clears back to default-of-first-type when the close button is clicked (nullable=true)', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    const { container } = renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={['number']}
        namespaces={['$env']}
        nullable
        onChange={handleChange}
      />,
    );
    const clear = container.querySelector('button.clear-button') as HTMLButtonElement | null;
    expect(clear).not.toBeNull();
    expect(clear).toHaveClass('clear-button');
    fireEvent.click(clear as HTMLButtonElement);
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('clears back to the valid minimum of the first type when nullable=false', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    const { container } = renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={[['number', { min: 1 }]]}
        namespaces={['$env']}
        nullable={false}
        onChange={handleChange}
      />,
    );
    const clear = container.querySelector('button.clear-button') as HTMLButtonElement | null;
    expect(clear).not.toBeNull();
    fireEvent.click(clear as HTMLButtonElement);
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('treats types=[] as variable-only mode with a readonly placeholder before selection', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value={undefined}
        types={[]}
        namespaces={['$env']}
        placeholder="Select variable"
        onChange={() => undefined}
      />,
    );

    const input = await screen.findByPlaceholderText('Select variable');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'variable-switcher' })).toBeInTheDocument();
  });

  it('clears a variable-only selection back to null', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    const { container } = renderWithCtx(
      ctx,
      <TypedVariableInput value="{{$env.SMTP_PORT}}" types={[]} namespaces={['$env']} onChange={handleChange} />,
    );

    const clear = container.querySelector('button.clear-button') as HTMLButtonElement | null;
    expect(clear).not.toBeNull();
    fireEvent.click(clear as HTMLButtonElement);
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('hides the variable switcher when hideVariable=true in variable-only mode', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput
        value="{{$env.SMTP_PORT}}"
        types={[]}
        namespaces={['$env']}
        hideVariable
        onChange={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'variable-tag' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'variable-switcher' })).toBeNull();
  });
});

describe('TypedVariableInput - object / JSON constant', () => {
  it('renders a JSON textarea for an object value when types include object', async () => {
    const ctx = createContextWithEnv();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={{ a: 1 }} types={['object']} namespaces={['$env']} onChange={() => undefined} />,
    );
    // The object is stringified into a textarea.
    const textarea = await screen.findByDisplayValue(/"a": 1/);
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('parses valid JSON on blur and emits the parsed object', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={{}} types={['object']} namespaces={['$env']} onChange={handleChange} />,
    );
    const textarea = await screen.findByDisplayValue('{}');
    fireEvent.change(textarea, { target: { value: '{"x": 42}' } });
    fireEvent.blur(textarea);
    expect(handleChange).toHaveBeenLastCalledWith({ x: 42 });
  });

  it('shows an error live on change (before blur) and does not emit on invalid JSON', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={{}} types={['object']} namespaces={['$env']} onChange={handleChange} />,
    );
    const textarea = await screen.findByDisplayValue('{}');
    // Typing an invalid value surfaces the error immediately — no blur needed (mirrors v1's `Json`, which validates on
    // every change).
    fireEvent.change(textarea, { target: { value: '{ not json' } });
    await waitFor(() => {
      // The raw `JSON.parse` error message is shown (matching v1), e.g. "Expected property name or '}' in JSON at
      // position …".
      expect(screen.getByText(/Expected property name/i)).toBeInTheDocument();
    });
    // The value is only emitted on blur, and never for an invalid value.
    fireEvent.blur(textarea);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('defaults to {} when the Constant > JSON type is picked', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(
      ctx,
      <TypedVariableInput value={null} types={['object']} namespaces={['$env']} onChange={handleChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));
    // Constant submenu → JSON leaf.
    fireEvent.click(await screen.findByText('Constant'));
    fireEvent.click(await screen.findByText('JSON'));
    expect(handleChange).toHaveBeenCalledWith({});
  });
});

describe('TypedVariableInput - injected metaTree', () => {
  // A bare context with no global `$env` — the injected tree is the only source.
  function createBareContext() {
    const ctx = new FlowContext();
    (ctx as any).t = (key: string) => key;
    return ctx;
  }

  // Mirrors a workflow node-result tree: a root whose children load lazily.
  function makeLazyTree(loadChildren: () => Promise<MetaTreeNode[]>): MetaTreeNode[] {
    return [
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: 'object',
        paths: ['$jobsMapByNodeKey'],
        children: loadChildren,
      },
    ];
  }

  it('renders the injected tree in the switcher, not the global one', async () => {
    const ctx = createBareContext();
    const metaTree: MetaTreeNode[] = [
      { name: 'n1', title: 'Approval node', type: 'object', paths: ['$jobsMapByNodeKey', 'n1'] },
    ];
    renderWithCtx(ctx, <TypedVariableInput value={null} metaTree={metaTree} onChange={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));
    await waitFor(() => {
      expect(screen.getByText('Approval node')).toBeInTheDocument();
    });
  });

  it('lazily resolves function children when a node is expanded', async () => {
    const ctx = createBareContext();
    const loadChildren = vi.fn(async () => [
      { name: 'status', title: 'Status', type: 'string', paths: ['$jobsMapByNodeKey', 'n1', 'status'] },
    ]);
    const metaTree = makeLazyTree(loadChildren);
    renderWithCtx(ctx, <TypedVariableInput value={null} metaTree={metaTree} onChange={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));
    const root = await screen.findByText('Node result');
    // Expanding the lazy node triggers loadData → loadMetaTreeChildren.
    fireEvent.click(root);
    await waitFor(() => {
      expect(loadChildren).toHaveBeenCalled();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('surfaces lazy children on the FIRST expansion (no stuck-loading regression)', async () => {
    const ctx = createBareContext();
    // A deferred promise so loading→resolved is a real two-phase transition, reproducing the rc-cascader
    // reference-cache bug where the first expand stayed stuck on the spinner until the column was reopened.
    let resolveChildren: (nodes: MetaTreeNode[]) => void = () => undefined;
    const childrenPromise = new Promise<MetaTreeNode[]>((resolve) => {
      resolveChildren = resolve;
    });
    const loadChildren = vi.fn(() => childrenPromise);
    const metaTree = makeLazyTree(loadChildren);
    renderWithCtx(ctx, <TypedVariableInput value={null} metaTree={metaTree} onChange={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));
    const root = await screen.findByText('Node result');
    fireEvent.click(root);
    expect(loadChildren).toHaveBeenCalledTimes(1);
    // Resolve after the click — the child must appear without reopening.
    resolveChildren([
      { name: 'secret', title: 'SMTP_HOST', type: 'string', paths: ['$jobsMapByNodeKey', 'n1', 'secret'] },
    ]);
    await waitFor(() => {
      expect(screen.getByText('SMTP_HOST')).toBeInTheDocument();
    });
  });

  it('emits the selected variable as a {{ ... }} expression with no inner spaces', async () => {
    const ctx = createBareContext();
    const handleChange = vi.fn();
    const metaTree: MetaTreeNode[] = [
      { name: 'n1', title: 'Approval node', type: 'string', paths: ['$jobsMapByNodeKey', 'n1'] },
    ];
    renderWithCtx(ctx, <TypedVariableInput value={null} metaTree={metaTree} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'variable-switcher' }));
    const leaf = await screen.findByText('Approval node');
    fireEvent.click(leaf);
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith('{{$jobsMapByNodeKey.n1}}');
    });
  });

  it('preloads a saved variable label across a lazy level (deep label not dropped on mount)', async () => {
    const ctx = createBareContext();
    // The query-node case: a saved reference `$jobsMapByNodeKey.n1.role` points below `n1`, whose children are a lazy
    // thunk (relation not yet expanded). On mount the tag must show the full path "Query / Role", not stop at "Query" —
    // the component walks the saved path resolving each lazy level. (Regression: reopening a saved condition showed
    // only "节点数据 / 查询数据" and dropped "角色标识".)
    const loadRoleFields = vi.fn(async () => [
      { name: 'role', title: 'Role', type: 'string', paths: ['$jobsMapByNodeKey', 'n1', 'role'] },
    ]);
    const metaTree: MetaTreeNode[] = [
      {
        name: '$jobsMapByNodeKey',
        title: 'Node result',
        type: 'object',
        paths: ['$jobsMapByNodeKey'],
        children: [
          {
            name: 'n1',
            title: 'Query',
            type: 'object',
            paths: ['$jobsMapByNodeKey', 'n1'],
            children: loadRoleFields,
          },
        ],
      },
    ];
    renderWithCtx(
      ctx,
      <TypedVariableInput value="{{$jobsMapByNodeKey.n1.role}}" metaTree={metaTree} onChange={() => undefined} />,
    );
    const tag = screen.getByRole('button', { name: 'variable-tag' });
    // Preload resolves the lazy level so the deep label appears without expanding.
    await waitFor(() => {
      expect(loadRoleFields).toHaveBeenCalled();
      expect(tag.textContent).toContain('Role');
    });
    expect(tag.textContent).toContain('Query');
  });
});

describe('TypedVariableInput - editor onChange propagation', () => {
  it('forwards numeric edits via onChange', async () => {
    const ctx = createContextWithEnv();
    const handleChange = vi.fn();
    renderWithCtx(ctx, <TypedVariableInput value={465} types={['number']} onChange={handleChange} />);
    const numberInput = await screen.findByDisplayValue('465');
    fireEvent.change(numberInput, { target: { value: '587' } });
    // antd InputNumber may emit on blur; force blur to flush
    fireEvent.blur(numberInput);
    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toBe(587);
  });
});
