/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { FlowContextProvider, type MetaTreeNode } from '@nocobase/flow-engine';
import React from 'react';
import { expect, it } from 'vitest';
import { WorkflowVariableTag } from '../WorkflowVariableTag';

it('does not show a parsing failure while relation fields are loading', async () => {
  let resolveFields: (fields: MetaTreeNode[]) => void = () => undefined;
  const fields = new Promise<MetaTreeNode[]>((resolve) => {
    resolveFields = resolve;
  });
  const metaTree: MetaTreeNode[] = [
    {
      name: '$context',
      title: 'Trigger variables',
      type: '',
      paths: ['$context'],
      children: [
        {
          name: 'applicant',
          title: 'Applicant',
          type: '',
          paths: ['$context', 'applicant'],
          children: () => fields,
        },
      ],
    },
  ];

  render(
    <FlowContextProvider context={{ t: (key: string) => key } as never}>
      <WorkflowVariableTag value="{{$context.applicant.id}}" metaTree={metaTree} />
    </FlowContextProvider>,
  );

  expect(screen.queryByText('Variable parsing failed')).not.toBeInTheDocument();
  resolveFields([{ name: 'id', title: 'ID', type: 'number', paths: ['$context', 'applicant', 'id'] }]);
  expect(await screen.findByText('Trigger variables / Applicant / ID')).toBeInTheDocument();
  expect(screen.queryByText('Variable parsing failed')).not.toBeInTheDocument();
});

it('does not reject an approval applicant path while the trigger variable root is a placeholder', () => {
  const placeholderTree: MetaTreeNode[] = [
    {
      name: '$context',
      title: 'Trigger variables',
      type: '',
      paths: ['$context'],
      children: [],
      disabled: true,
    },
  ];
  const resolvedTree: MetaTreeNode[] = [
    {
      name: '$context',
      title: 'Trigger variables',
      type: '',
      paths: ['$context'],
      children: [
        {
          name: 'applicant',
          title: 'Applicant',
          type: 'hasOne',
          paths: ['$context', 'applicant'],
          children: [{ name: 'id', title: 'ID', type: 'bigInt', paths: ['$context', 'applicant', 'id'] }],
        },
      ],
    },
  ];

  const { rerender } = render(
    <FlowContextProvider context={{ t: (key: string) => key } as never}>
      <WorkflowVariableTag value="{{$context.applicant.id}}" metaTree={placeholderTree} />
    </FlowContextProvider>,
  );

  expect(screen.queryByText('Variable parsing failed')).not.toBeInTheDocument();

  rerender(
    <FlowContextProvider context={{ t: (key: string) => key } as never}>
      <WorkflowVariableTag value="{{$context.applicant.id}}" metaTree={resolvedTree} />
    </FlowContextProvider>,
  );

  expect(screen.getByText('Trigger variables / Applicant / ID')).toBeInTheDocument();
  expect(screen.queryByText('Variable parsing failed')).not.toBeInTheDocument();
});
