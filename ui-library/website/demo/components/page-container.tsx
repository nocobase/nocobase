import { Plus } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

const summaries = [
  { label: 'Open orders', value: '128', detail: '12 awaiting payment' },
  { label: 'Shipped this week', value: '342', detail: 'Up 8% on last week' },
  { label: 'Returns', value: '6', detail: '2 need review' },
] as const;

export function PageContainerDemo(): ReactElement {
  return (
    <div className='min-h-svh bg-background text-foreground'>
      <PageContainer>
        <PageHeader
          actions={
            <Button type='button'>
              <Plus data-icon='inline-start' />
              New order
            </Button>
          }
          description='Track every order from checkout to delivery, and act on the ones that need attention.'
          title='Orders'
        />
        <div className='grid gap-4 sm:grid-cols-3'>
          {summaries.map((summary) => (
            <Card key={summary.label}>
              <CardHeader>
                <CardDescription>{summary.label}</CardDescription>
                <CardTitle className='text-2xl'>{summary.value}</CardTitle>
              </CardHeader>
              <CardContent className='text-sm text-muted-foreground'>
                {summary.detail}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>
              Each section of a page sits directly in the container, which
              spaces them evenly.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    </div>
  );
}
