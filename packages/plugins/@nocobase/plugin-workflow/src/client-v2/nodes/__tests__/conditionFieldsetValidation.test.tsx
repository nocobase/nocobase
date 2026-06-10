/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Characterization tests for the condition node's "switch engine → keep the
 * expression error" behaviour (must match v1, where the field model — and its
 * error — persists while the DOM hides). These isolate the antd Form mechanics
 * from the workflow plumbing so the root cause is pinned without a full canvas.
 */

import { Form, Input, Radio } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

const BASIC = 'basic';

// A minimal stand-in for ConditionFieldset's calculation/expression switch: two always-mounted Form.Items toggled with
// `hidden`, the expression carrying a validator that fails for the literal `BAD`.
function MiniFieldset({ conditionalRules }: { conditionalRules: boolean }) {
  const engine = Form.useWatch('engine') ?? BASIC;
  return (
    <>
      <Form.Item name="engine" initialValue={BASIC}>
        <Radio.Group
          options={[
            { value: BASIC, label: 'Basic' },
            { value: 'formula.js', label: 'Formula.js' },
          ]}
        />
      </Form.Item>

      <Form.Item name="calculation" label="calc" hidden={engine !== BASIC}>
        <Input aria-label="calc-input" />
      </Form.Item>

      <Form.Item
        name="expression"
        label="expr"
        hidden={engine === BASIC}
        dependencies={['engine']}
        // The variant under test:
        //  - conditionalRules=true  → rules become `[]` when hidden (the BUG:
        //    clears the error, which never returns).
        //  - conditionalRules=false → rules array is STABLE; each validator
        //    no-ops for the inactive engine (the FIX shipped in condition.tsx).
        rules={
          conditionalRules
            ? engine === BASIC
              ? []
              : [
                  {
                    validator: async (_r: unknown, value: string) => {
                      if (value === 'BAD') throw new Error('Expression syntax error');
                    },
                  },
                ]
            : [
                {
                  validator: async (_r: unknown, value: string) => {
                    if (engine !== BASIC && value === 'BAD') {
                      throw new Error('Expression syntax error');
                    }
                  },
                },
              ]
        }
      >
        <Input aria-label="expr-input" />
      </Form.Item>
    </>
  );
}

function setup(conditionalRules: boolean) {
  function Wrapper() {
    const [form] = Form.useForm();
    return (
      <Form form={form} initialValues={{ engine: BASIC, expression: 'BAD' }}>
        <MiniFieldset conditionalRules={conditionalRules} />
      </Form>
    );
  }
  return render(<Wrapper />);
}

describe('condition fieldset — switch engine keeps expression error', () => {
  // The real scenario: the user does NOT re-edit the expression after switching back — they just toggle the engine
  // radios. The error must reappear on its own (v1 behaviour), driven by `dependencies` re-validating.
  async function showInitialError() {
    fireEvent.click(screen.getByRole('radio', { name: /Formula\.js/i }));
    fireEvent.change(screen.getByLabelText('expr-input'), { target: { value: 'BAD' } });
    await waitFor(() => {
      expect(screen.getByText('Expression syntax error')).toBeInTheDocument();
    });
  }

  async function roundTripEngine() {
    fireEvent.click(screen.getByRole('radio', { name: /Basic/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Formula\.js/i }));
  }

  it('stable rules + dependencies keep the expression error across a basic round-trip', async () => {
    setup(false); // stable rules; each validator no-ops for the inactive engine
    await showInitialError();
    await roundTripEngine();
    // Without re-editing the expression, the error reappears on its own — matching v1, where the field model + error
    // persist while the DOM hides. (Toggling `rules` to `[]` when hidden — `setup(true)` — instead clears the error
    // permanently; that anti-pattern is why condition.tsx keeps the rules array stable and no-ops each validator for
    // the inactive engine.)
    await waitFor(() => {
      expect(screen.getByText('Expression syntax error')).toBeInTheDocument();
    });
  });
});
