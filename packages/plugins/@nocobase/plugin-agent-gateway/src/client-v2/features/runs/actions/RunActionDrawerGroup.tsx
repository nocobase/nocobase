/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { BuildTaskDrawer, ExternalRunImportDrawer, SkillUploadModal } from '../../../pages/runs/RunActionDrawers';
import type { TFunction } from '../../../pages/runs/types';
import { useRunActionDrawers } from '../hooks/useRunActionDrawers';

interface RunActionDrawerGroupProps {
  t: TFunction;
  controller: ReturnType<typeof useRunActionDrawers>;
}

export function RunActionDrawerGroup({ t, controller }: RunActionDrawerGroupProps) {
  const { buildTask, externalRunImport, skillUpload } = controller;

  return (
    <>
      <BuildTaskDrawer
        t={t}
        open={buildTask.open}
        form={buildTask.form}
        loading={buildTask.loading}
        optionsLoading={buildTask.optionsLoading}
        hasOnlineRunner={buildTask.hasOnlineRunner}
        runnerOptions={buildTask.runnerOptions}
        skillVersionOptions={buildTask.skillVersionOptions}
        taskTemplateOptions={buildTask.taskTemplateOptions}
        defaultCwd={buildTask.defaultCwd}
        defaultRunner={buildTask.defaultRunner}
        onClose={buildTask.close}
        onSubmit={buildTask.submit}
        onTemplateChange={buildTask.handleTaskTemplateChange}
        onUploadSkill={buildTask.openSkillUpload}
      />

      <ExternalRunImportDrawer
        t={t}
        open={externalRunImport.open}
        form={externalRunImport.form}
        loading={externalRunImport.loading}
        logContent={externalRunImport.logContent}
        onClose={externalRunImport.close}
        onSubmit={externalRunImport.submit}
        onLogContentChange={externalRunImport.setLogContent}
        beforeUpload={externalRunImport.beforeUpload}
        onRemove={externalRunImport.onRemove}
      />

      <SkillUploadModal
        t={t}
        open={skillUpload.open}
        form={skillUpload.form}
        loading={skillUpload.loading}
        result={skillUpload.result}
        onClose={skillUpload.close}
        onSubmit={skillUpload.submit}
        beforeUpload={skillUpload.beforeUpload}
        onRemove={skillUpload.onRemove}
      />
    </>
  );
}
