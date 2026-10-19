import { useState, type ReactElement, type ReactNode } from 'react';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

export interface WorkflowHistoryEntry {
  readonly id: string;
  readonly version: number;
  readonly at: string;
  readonly transition: string;
  readonly from: string | null;
  readonly to: string;
  readonly actorId?: string | null;
}
export interface WorkflowEffectEntry {
  readonly id: string;
  readonly effect: string;
  readonly status: string;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly error?: string | null;
}
export interface WorkflowExecutionLabels {
  processDiagram: string;
  history: string;
  historyHint: string;
  step: string;
  transition: string;
  from: string;
  to: string;
  actor: string;
  time: string;
  noHistory: string;
  effects: string;
  effect: string;
  state: string;
  attempts: string;
  error: string;
  noEffects: string;
  executionParameters: string;
  snapshotHint: string;
  showStep: (step: number) => string;
}
/** Historical selection only changes the display; execution and recovery remain caller-owned. */
export interface WorkflowExecutionDetailProps<T extends WorkflowHistoryEntry> {
  transitions: readonly T[];
  state: string;
  effects: readonly WorkflowEffectEntry[];
  parameters?: ReactNode;
  labels: WorkflowExecutionLabels;
  stateLabel: (name: string) => ReactNode;
  transitionLabel: (name: string) => ReactNode;
  dateLabel: (at: string) => ReactNode;
  effectStatusLabel: (status: string) => ReactNode;
  renderDiagram: (selection: {
    current: string;
    history: readonly T[];
  }) => ReactNode;
}

export function WorkflowExecutionDetail<T extends WorkflowHistoryEntry>({
  transitions: transitionsInput,
  state,
  effects,
  parameters,
  labels,
  stateLabel,
  transitionLabel,
  dateLabel,
  effectStatusLabel,
  renderDiagram,
}: WorkflowExecutionDetailProps<T>): ReactElement {
  const [selected, setSelected] = useState<string>();
  const transitions = [...transitionsInput].sort(
    (a, b) =>
      a.version - b.version ||
      a.at.localeCompare(b.at) ||
      a.id.localeCompare(b.id),
  );
  const index = selected
    ? transitions.findIndex((entry) => entry.id === selected)
    : -1;
  const history = index < 0 ? transitions : transitions.slice(0, index + 1);
  const current = index < 0 ? state : transitions[index].to;
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid min-w-0 grid-cols-1 items-stretch gap-6 lg:grid-cols-2'>
        <Card
          className='min-w-0'
          role='region'
          aria-label={labels.processDiagram}
        >
          <CardHeader>
            <CardTitle>
              <h2>{labels.processDiagram}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col gap-4'>
            {renderDiagram({ current, history })}
          </CardContent>
        </Card>
        <div className='flex min-w-0 flex-col gap-6'>
          <Card className='min-w-0' role='region' aria-label={labels.history}>
            <CardHeader>
              <CardTitle>
                <h2>{labels.history}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className='min-w-0'>
              <p className='mb-4 text-sm text-muted-foreground'>
                {labels.historyHint}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{labels.step}</TableHead>
                    <TableHead>{labels.transition}</TableHead>
                    <TableHead>{labels.from}</TableHead>
                    <TableHead>{labels.to}</TableHead>
                    <TableHead>{labels.actor}</TableHead>
                    <TableHead>{labels.time}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transitions.map((entry, step) => (
                    <TableRow
                      key={entry.id}
                      data-selected={entry.id === selected ? 'true' : undefined}
                    >
                      <TableCell>
                        <Button
                          size='sm'
                          variant={
                            entry.id === selected ? 'secondary' : 'ghost'
                          }
                          aria-label={labels.showStep(step + 1)}
                          aria-pressed={entry.id === selected}
                          onClick={() => setSelected(entry.id)}
                        >
                          {step + 1}
                        </Button>
                      </TableCell>
                      <TableCell>{transitionLabel(entry.transition)}</TableCell>
                      <TableCell>
                        {entry.from ? stateLabel(entry.from) : '—'}
                      </TableCell>
                      <TableCell>{stateLabel(entry.to)}</TableCell>
                      <TableCell>{entry.actorId}</TableCell>
                      <TableCell>{dateLabel(entry.at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!transitions.length && (
                <p className='text-sm text-muted-foreground'>
                  {labels.noHistory}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className='min-w-0' role='region' aria-label={labels.effects}>
            <CardHeader>
              <CardTitle>
                <h2>{labels.effects}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className='min-w-0'>
              {effects.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{labels.effect}</TableHead>
                      <TableHead>{labels.state}</TableHead>
                      <TableHead>{labels.attempts}</TableHead>
                      <TableHead>{labels.error}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {effects.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{run.effect}</TableCell>
                        <TableCell>{effectStatusLabel(run.status)}</TableCell>
                        <TableCell>
                          {run.attempts} / {run.maxAttempts}
                        </TableCell>
                        <TableCell className='max-w-80 whitespace-normal break-words text-destructive'>
                          {run.error || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {labels.noEffects}
                </p>
              )}
            </CardContent>
          </Card>
          {parameters && (
            <Card
              className='min-w-0'
              role='region'
              aria-label={labels.executionParameters}
            >
              <CardHeader>
                <CardTitle>
                  <h2>{labels.executionParameters}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent className='min-w-0'>
                <p className='mb-4 text-sm text-muted-foreground'>
                  {labels.snapshotHint}
                </p>
                {parameters}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
