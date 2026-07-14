/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Drawer } from 'antd';
import React from 'react';

import type { TFunction } from '../../../pages/runs/types';
import { useRelatedRunDetails } from '../hooks/useRelatedRunDetails';
import { SKILL_DETAIL_DRAWER_WIDTH, TASK_RUN_DRAWER_WIDTH } from '../runShared';
import {
  SkillDetailDrawerContent,
  TaskTemplateDetailDrawerContent,
  getSkillVersionDetailDisplayLabel,
} from './RelatedDetails';

interface RelatedDetailDrawersProps {
  t: TFunction;
  controller: ReturnType<typeof useRelatedRunDetails>;
}

export function RelatedDetailDrawers({ t, controller }: RelatedDetailDrawersProps) {
  const { taskTemplate, skill } = controller;
  const selectedTaskTemplate =
    taskTemplate.request.data &&
    taskTemplate.selectedId &&
    (taskTemplate.request.data.id === taskTemplate.selectedId ||
      taskTemplate.request.data.templateKey === taskTemplate.selectedId)
      ? taskTemplate.request.data
      : null;
  const selectedSkillVersion =
    skill.request.data &&
    skill.selectedId &&
    (skill.request.data.id === skill.selectedId || skill.request.data.skillVersionId === skill.selectedId)
      ? skill.request.data
      : null;

  return (
    <>
      <Drawer
        title={
          selectedTaskTemplate
            ? selectedTaskTemplate.displayName || selectedTaskTemplate.templateKey
            : t('Task template detail')
        }
        open={taskTemplate.open}
        onClose={taskTemplate.close}
        width={TASK_RUN_DRAWER_WIDTH}
        destroyOnClose
      >
        <TaskTemplateDetailDrawerContent
          template={selectedTaskTemplate}
          loading={taskTemplate.request.loading}
          error={taskTemplate.error}
          t={t}
        />
      </Drawer>

      <Drawer
        title={selectedSkillVersion ? getSkillVersionDetailDisplayLabel(selectedSkillVersion) : t('Skill detail')}
        open={skill.open}
        onClose={skill.close}
        width={SKILL_DETAIL_DRAWER_WIDTH}
        destroyOnClose
      >
        <SkillDetailDrawerContent
          skillVersion={selectedSkillVersion}
          loading={skill.request.loading}
          error={skill.error}
          t={t}
        />
      </Drawer>
    </>
  );
}
