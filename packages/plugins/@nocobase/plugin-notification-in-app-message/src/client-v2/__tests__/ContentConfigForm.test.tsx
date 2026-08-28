/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MetaTreeNode } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  inputs: [] as Array<{ metaTree?: MetaTreeNode[] }>,
  textAreas: [] as Array<{ metaTree?: MetaTreeNode[] }>,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowVariableInput: (props: { metaTree?: MetaTreeNode[] }) => {
    holder.inputs.push(props);
    return <input data-testid="workflow-variable-input" />;
  },
  WorkflowVariableTextArea: (props: { metaTree?: MetaTreeNode[] }) => {
    holder.textAreas.push(props);
    return <textarea data-testid="workflow-variable-textarea" />;
  },
}));

vi.mock('../locale', () => ({
  useInAppMessageTranslation: () => ({ t: (key: string) => key }),
  useT: () => (key: string) => key,
}));

import { ContentConfigForm } from '../components/ContentConfigForm';

const APPROVAL_VARIABLES: MetaTreeNode[] = [
  { name: 'statusText', title: 'Status', type: 'string', paths: ['statusText'] },
  {
    name: 'approval',
    title: 'Approval',
    type: 'string',
    paths: ['approval'],
    children: [
      { name: 'workflowTitle', title: 'Workflow title', type: 'string', paths: ['approval', 'workflowTitle'] },
    ],
  },
];

function renderForm(variableOptions?: MetaTreeNode[]) {
  return render(
    <Form>
      <ContentConfigForm namePrefix={['template']} variableOptions={variableOptions} />
    </Form>,
  );
}

describe('in-app-message ContentConfigForm (v2)', () => {
  beforeEach(() => {
    holder.inputs.length = 0;
    holder.textAreas.length = 0;
  });

  it('forwards the caller-provided variableOptions to every variable field', () => {
    renderForm(APPROVAL_VARIABLES);

    // title + desktop url + mobile url
    expect(holder.inputs).toHaveLength(3);
    for (const props of holder.inputs) {
      expect(props.metaTree).toBe(APPROVAL_VARIABLES);
    }
    expect(holder.textAreas).toHaveLength(1);
    expect(holder.textAreas[0].metaTree).toBe(APPROVAL_VARIABLES);
  });

  it('falls back to the canvas-derived workflow tree when no variableOptions is given', () => {
    renderForm();

    expect(holder.inputs).toHaveLength(3);
    for (const props of holder.inputs) {
      expect(props.metaTree).toBeUndefined();
    }
    expect(holder.textAreas).toHaveLength(1);
    expect(holder.textAreas[0].metaTree).toBeUndefined();
  });

  it('honours an empty variableOptions as "no variables" rather than falling back', () => {
    const empty: MetaTreeNode[] = [];
    renderForm(empty);

    for (const props of holder.inputs) {
      expect(props.metaTree).toBe(empty);
    }
    expect(holder.textAreas[0].metaTree).toBe(empty);
  });
});
