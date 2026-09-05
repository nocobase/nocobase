/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { KnowledgeBaseSettings } from '../pages/EmployeesPage';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

const apiClient = {
  resource: () => ({
    list: vi.fn().mockResolvedValue({ data: { data: [{ key: 'handbook', name: 'Handbook' }] } }),
  }),
};

describe('AI employee knowledge-base settings', () => {
  it('renders both retrieval strategies and the permission-aware empty-selection guidance', async () => {
    const onFinish = vi.fn();
    render(
      <Form
        initialValues={{
          enableKnowledgeBase: true,
          knowledgeBase: { retrievalStrategy: 'onDemand', knowledgeBaseKeys: [], topK: 3, score: '0.6' },
          knowledgeBasePrompt: 'Use retrieved content: {knowledgeBaseData}',
        }}
        onFinish={onFinish}
      >
        <KnowledgeBaseSettings apiClient={apiClient as never} />
        <button type="submit">Submit</button>
      </Form>,
    );

    expect(screen.getByRole('radio', { name: /Automatically retrieve for every question/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Retrieve on demand/ })).toBeChecked();
    expect(
      screen.getByText('Retrieve before every user question, then answer with the retrieved content.'),
    ).toBeTruthy();
    expect(
      screen.getByText('The AI employee retrieves knowledge-base content only when it determines that it is needed.'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Actual retrieval is limited to knowledge bases accessible to the roles of the user using this AI employee. Inaccessible knowledge bases are excluded.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Leave blank to retrieve from all knowledge bases')).toBeTruthy();
    expect(screen.getByText('Maximum number of knowledge-base entries returned for each retrieval.')).toBeTruthy();
    expect(
      screen.getByText('Minimum similarity score for knowledge-base content to be included in retrieval results.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          knowledgeBase: expect.objectContaining({ knowledgeBaseKeys: [], retrievalStrategy: 'onDemand' }),
        }),
      ),
    );
  });

  it('blocks saving when the knowledge-base prompt omits the retrieved-content placeholder', async () => {
    const onFinish = vi.fn();
    render(
      <Form
        initialValues={{
          enableKnowledgeBase: true,
          knowledgeBase: { retrievalStrategy: 'onDemand', knowledgeBaseKeys: [], topK: 3, score: '0.6' },
          knowledgeBasePrompt: 'Use retrieved content.',
        }}
        onFinish={onFinish}
      >
        <KnowledgeBaseSettings apiClient={apiClient as never} />
        <button type="submit">Submit</button>
      </Form>,
    );

    expect(
      screen.getByText('Include {knowledgeBaseData} in the prompt to insert the retrieved knowledge-base content.'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      await screen.findByText('The Knowledge Base Prompt must include {knowledgeBaseData} before you can save it.'),
    ).toBeTruthy();
    expect(onFinish).not.toHaveBeenCalled();
  });
});
