/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import React from 'react';

import { RunActionDrawerGroup } from '../features/runs/actions/RunActionDrawerGroup';
import { RelatedDetailDrawers } from '../features/runs/detail/RelatedDetailDrawers';
import { RunDetailDrawer } from '../features/runs/detail/RunDetailDrawer';
import { useRelatedRunDetails } from '../features/runs/hooks/useRelatedRunDetails';
import { useRunActionDrawers } from '../features/runs/hooks/useRunActionDrawers';
import { useRunDetailController } from '../features/runs/hooks/useRunDetailController';
import { useRunListController } from '../features/runs/hooks/useRunListController';
import { RunsListPanel } from '../features/runs/list/RunsListPanel';
import { useT } from '../locale';
import {
  useInitialRunDetailQuery,
  useInitialSkillVersionDetailQuery,
  useInitialTaskTemplateDetailQuery,
} from './runs/runLocation';
import type { AgentGatewayPageContext } from './runs/types';

export { ArtifactContentPreview, sanitizeHtmlArtifactPreview } from '../features/runs/artifacts/ArtifactsPanel';

export default function AgentGatewayRunsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayPageContext;
  const initialRunId = useInitialRunDetailQuery();
  const initialTaskTemplateId = useInitialTaskTemplateDetailQuery();
  const initialSkillVersionId = useInitialSkillVersionDetailQuery();
  const runList = useRunListController({ ctx, t });
  const runDetail = useRunDetailController({ ctx, t, initialRunId });
  const relatedDetails = useRelatedRunDetails({
    ctx,
    t,
    initialTaskTemplateId,
    initialSkillVersionId,
  });
  const actionDrawers = useRunActionDrawers({
    ctx,
    t,
    refreshRuns: runList.request.refresh,
    openRunById: runDetail.openById,
  });

  return (
    <section aria-label={t('Runs')}>
      <RunsListPanel
        t={t}
        data={runList.data}
        loading={runList.request.loading && !runList.request.data}
        filters={runList.filters}
        sort={runList.sort}
        filterCollection={runList.filterCollection}
        pagination={runList.tablePagination}
        onFilterChange={runList.handleFilterChange}
        onTableChange={runList.handleTableChange}
        onOpenRun={runDetail.openRun}
        onOpenTaskTemplate={relatedDetails.taskTemplate.openDetails}
        onOpenSkill={relatedDetails.skill.openDetails}
        onCreate={actionDrawers.buildTask.openDrawer}
        onImport={actionDrawers.externalRunImport.openDrawer}
        onRefresh={runList.request.refresh}
      />

      <RunDetailDrawer
        ctx={ctx}
        t={t}
        controller={runDetail}
        runListData={runList.data}
        refreshRuns={runList.request.refresh}
      />
      <RelatedDetailDrawers t={t} controller={relatedDetails} />
      <RunActionDrawerGroup t={t} controller={actionDrawers} />
    </section>
  );
}
