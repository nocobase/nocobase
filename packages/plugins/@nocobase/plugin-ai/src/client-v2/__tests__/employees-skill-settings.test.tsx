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
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillSettings } from '../pages/EmployeesPage';

const mocks = vi.hoisted(() => ({
  repo: {
    aiSkills: [] as Array<Record<string, unknown>>,
    aiSkillsLoading: false,
    getAISkills: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('../repositories/hooks/useAIConfigRepository', () => ({
  useAIConfigRepository: () => mocks.repo,
}));

const renderSkillSettings = (skills: string[] = [], builtIn = false) =>
  render(
    <Form initialValues={{ skillSettings: { skills, tools: [] } }}>
      <SkillSettings builtIn={builtIn} />
    </Form>,
  );

describe('AI employee custom skill settings', () => {
  beforeEach(() => {
    mocks.repo.aiSkills = [];
    mocks.repo.aiSkillsLoading = false;
    mocks.repo.getAISkills.mockClear();
  });

  it('hides the custom skills section when no CUSTOM skill exists', () => {
    mocks.repo.aiSkills = [
      {
        scope: 'GENERAL',
        name: 'general-skill',
        description: 'General skill',
      },
      {
        scope: 'SPECIFIED',
        name: 'specified-skill',
        description: 'Specified skill',
      },
    ];

    renderSkillSettings();

    expect(screen.queryByText('Custom skills')).toBeNull();
    expect(screen.queryByText('Add skill')).toBeNull();
  });

  it('adds and removes a CUSTOM skill for the current AI employee', async () => {
    mocks.repo.aiSkills = [
      {
        scope: 'CUSTOM',
        name: 'custom-reporting',
        title: 'Custom reporting',
        description: 'Create custom reports',
      },
    ];

    renderSkillSettings();

    const addSkillButton = screen.getByText('Add skill').closest('button');
    if (!addSkillButton) {
      throw new Error('Add skill button not found');
    }
    fireEvent.mouseEnter(addSkillButton);
    fireEvent.click(await screen.findByText('Custom reporting'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    });

    expect(addSkillButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
      expect(screen.getByText('Add skill').closest('button')).not.toBeDisabled();
    });
  });

  it('expands the custom skills panel by default when the employee has a CUSTOM skill', () => {
    mocks.repo.aiSkills = [
      {
        scope: 'CUSTOM',
        name: 'custom-reporting',
        title: 'Custom reporting',
        description: 'Create custom reports',
      },
    ];

    renderSkillSettings(['custom-reporting'], true);

    const customSkillsHeader = screen.getByText('Custom skills').closest('.ant-collapse-header');
    expect(customSkillsHeader).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
    expect(screen.getByText('Add skill').closest('button')).toBeDisabled();
  });
});
