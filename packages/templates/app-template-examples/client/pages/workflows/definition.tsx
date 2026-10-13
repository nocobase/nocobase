import { useState, type ReactElement } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import {
  IdentitySelect,
  ProcessDiagram,
  useParameterBindingEditor,
} from '@nocobase/app-plugin-lifecycle-example/client';
import { RouteDrawer } from '#components/route-drawer';
import { Button } from '#components/ui/button';
import type { WorkflowDefinition } from '../../../shared/workflows.js';
import { DataState } from './shared.js';
import { useWorkflowData, useWorkflowLabels } from './hooks.js';

function DefinitionDiagram({
  definition,
}: {
  readonly definition: WorkflowDefinition;
}): ReactElement {
  const { t } = useTranslation();
  const [actor, setActor] = useState('zhao');
  const binding = useParameterBindingEditor(definition.description, actor);
  const configured = Boolean(
    definition.description.parameterConfiguration?.groups.length,
  );
  return (
    <div className='flex flex-col gap-4'>
      {configured && (
        <IdentitySelect
          value={actor}
          onChange={setActor}
          roles={[
            'finance',
            'director',
            'manager',
            'applicant',
            'agent',
            'customer',
          ]}
        />
      )}
      <p className='text-sm text-muted-foreground'>
        {t(configured ? 'workflows.parameterHint' : 'workflows.noParameters')}
      </p>
      {binding.editor}
      <ProcessDiagram
        description={definition.description}
        labelNamespace={
          definition.workflow.source === 'office'
            ? '@nocobase/app-plugin-office-flows-example'
            : undefined
        }
        onParameterBinding={configured ? binding.onBinding : undefined}
      />
    </div>
  );
}
export default function DefinitionPage(): ReactElement {
  const { workflowId = '' } = useParams();
  const { t } = useTranslation();
  const labels = useWorkflowLabels();
  const location = useLocation();
  const request = useWorkflowData<{ data: WorkflowDefinition }>(
    `workflows/definitions/${encodeURIComponent(workflowId)}`,
  );
  return (
    <RouteDrawer
      title={
        request.data
          ? labels.title(request.data.data.workflow)
          : t('workflows.definition')
      }
      description={workflowId}
      closeTo={{ pathname: '/workflows/definitions', search: location.search }}
      // Wide drawers keep branching diagrams readable while retaining the list context.
      className='w-full sm:max-w-5xl'
    >
      <DataState {...request} retry={request.reload} />
      {request.data && (
        <div className='flex flex-col gap-4'>
          <Button
            render={
              <Link
                to={`/workflows/executions?workflowId=${encodeURIComponent(workflowId)}`}
              />
            }
            nativeButton={false}
            variant='outline'
          >
            {t('workflows.viewExecutions')}
          </Button>
          <DefinitionDiagram key={workflowId} definition={request.data.data} />
        </div>
      )}
    </RouteDrawer>
  );
}
