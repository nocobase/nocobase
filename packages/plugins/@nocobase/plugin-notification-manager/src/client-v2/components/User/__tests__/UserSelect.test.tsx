/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  ctx: null as any,
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useFlowContext: () => holder.ctx,
    VariableInput: (props: any) => {
      const ConstantComponent = props.converters?.renderInputComponent?.({ paths: ['constant'] });
      return ConstantComponent ? <ConstantComponent value={props.value} onChange={props.onChange} /> : null;
    },
  };
});

vi.mock('../../../locale', () => ({
  useNotificationTranslation: () => ({ t: (key: string) => key }),
}));

import { UserSelect } from '../UserSelect';

describe('UserSelect', () => {
  it('renders a users dropdown for the empty constant receiver mode', async () => {
    holder.ctx = {
      api: {
        resource: () => ({
          list: vi.fn().mockResolvedValue({
            data: {
              data: [{ id: 1, nickname: 'Demo user' }],
            },
          }),
        }),
      },
    };

    render(<UserSelect value="" onChange={() => undefined} variableOptions={[]} />);

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
