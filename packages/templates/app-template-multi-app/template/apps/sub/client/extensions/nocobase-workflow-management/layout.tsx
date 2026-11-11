import type { ReactElement, ReactNode } from 'react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';

export type WorkflowTab = 'definitions' | 'executions';

/** The caller owns routes, tab URLs and permissions; details replace the list chrome. */
export interface WorkflowManagementLayoutProps {
  title: string;
  description?: ReactNode;
  labels: Record<WorkflowTab, string>;
  tab: WorkflowTab;
  onTabChange: (tab: WorkflowTab) => void;
  detail?: boolean;
  children: ReactNode;
}

export function WorkflowManagementLayout({
  title,
  description,
  labels,
  tab,
  onTabChange,
  detail = false,
  children,
}: WorkflowManagementLayoutProps): ReactElement {
  return (
    <PageContainer>
      {!detail && (
        <>
          <PageHeader title={title} description={description} />
          <Tabs
            value={tab}
            onValueChange={(value) => onTabChange(value as WorkflowTab)}
          >
            <TabsList variant='line'>
              <TabsTrigger value='definitions'>
                {labels.definitions}
              </TabsTrigger>
              <TabsTrigger value='executions'>{labels.executions}</TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      )}
      {children}
    </PageContainer>
  );
}

export interface WorkflowDefinitionDetailProps {
  diagram: ReactNode;
  parameters?: ReactNode;
  diagramTitle: string;
  parametersTitle: string;
}

export function WorkflowDefinitionDetail({
  diagram,
  parameters,
  diagramTitle,
  parametersTitle,
}: WorkflowDefinitionDetailProps): ReactElement {
  return (
    <div className='flex flex-col gap-4'>
      <div
        className={
          parameters == null
            ? 'min-w-0'
            : 'grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'
        }
      >
        <Card className='min-w-0' role='region' aria-label={diagramTitle}>
          <CardHeader>
            <CardTitle>
              <h2>{diagramTitle}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col'>{diagram}</CardContent>
        </Card>
        {parameters != null && (
          <Card className='min-w-0' role='region' aria-label={parametersTitle}>
            <CardHeader>
              <CardTitle>
                <h2>{parametersTitle}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>{parameters}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
