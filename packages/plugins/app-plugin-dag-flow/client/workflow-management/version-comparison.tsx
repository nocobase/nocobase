import { ArrowLeftRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { WORKFLOW_NS } from '../namespace.js';
import type { WorkflowDetailRecord } from './types.js';
import { compareVersions, type FieldDifference } from './version-diff.js';
import { definition } from './record-definition.js';
import { WorkflowCanvas } from './workflow-canvas.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog.js';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './ui/select.js';

function identity(version: WorkflowDetailRecord): string {
  return version.id ?? version.hash ?? version.key;
}
function FieldDiff({ fields }: { fields: FieldDifference[] }): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const value = (item: unknown): string =>
    item === undefined ? t('comparison.absent') : JSON.stringify(item, null, 2);
  return fields.length ? (
    <table className='w-full table-fixed border-t border-border text-left text-sm'>
      <thead>
        <tr>
          <th scope='col' className='w-1/2 p-2 font-medium'>
            {t('comparison.before')}
          </th>
          <th scope='col' className='w-1/2 p-2 font-medium'>
            {t('comparison.after')}
          </th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.path}>
            {(['before', 'after'] as const).map((side) => (
              <td
                key={side}
                className={
                  side === 'before'
                    ? 'bg-destructive/5 p-2 align-top'
                    : 'bg-primary/5 p-2 align-top'
                }
              >
                <pre className='text-xs whitespace-pre-wrap break-words'>
                  <span className='text-muted-foreground'>{field.path}</span>
                  {'\n'}
                  {value(field[side])}
                </pre>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p className='p-2 text-muted-foreground'>{t('comparison.noChanges')}</p>
  );
}
export function WorkflowComparisonDialog({
  workflow,
  revisions,
  target,
  onClose,
}: {
  workflow: WorkflowDetailRecord;
  target?: WorkflowDetailRecord;
  revisions: WorkflowDetailRecord[];
  onClose: () => void;
}): ReactElement {
  const { t } = useTranslation(WORKFLOW_NS);
  const index = revisions.findIndex(
    (item) => identity(item) === identity(workflow),
  );
  const [leftId, setLeftId] = useState(() =>
    identity(
      (target ? workflow : undefined) ??
        revisions[index + 1] ??
        revisions.find((item) => identity(item) !== identity(workflow)) ??
        workflow,
    ),
  );
  const [rightId, setRightId] = useState(() => identity(target ?? workflow));
  const [selected, setSelected] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const selectNode = (key: string | null): void => {
    setSelected(key);
    setFocusRequest((request) => request + 1);
  };
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const item = sidebar?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!sidebar || !item) return;
    const containerBounds = sidebar.getBoundingClientRect();
    const itemBounds = item.getBoundingClientRect();
    if (itemBounds.top < containerBounds.top)
      sidebar.scrollTop += itemBounds.top - containerBounds.top;
    else if (itemBounds.bottom > containerBounds.bottom)
      sidebar.scrollTop += itemBounds.bottom - containerBounds.bottom;
  }, [selected, focusRequest]);

  const left = revisions.find((item) => identity(item) === leftId) ?? workflow;
  const right =
    revisions.find((item) => identity(item) === rightId) ?? workflow;
  const diff = useMemo(() => compareVersions(left, right), [left, right]);
  const leftDefinition = useMemo(() => definition(left), [left]);
  const rightDefinition = useMemo(() => definition(right), [right]);
  const statuses = useMemo(
    () => new Map(diff.nodes.map((node) => [node.key, node.status])),
    [diff],
  );
  const changedConnections = useMemo(
    () =>
      new Set(
        diff.nodes
          .filter((item) => item.connectionsChanged)
          .map((item) => item.key),
      ),
    [diff],
  );
  const node = diff.nodes.find((item) => item.key === selected);
  const changes = diff.nodes.filter((item) => item.status !== 'unchanged');
  const label = (item: WorkflowDetailRecord): string =>
    `${item.version ?? t('common.unpublished')} · ${(item.hash ?? item.id ?? '').slice(0, 8)}${item.current ? ` · ${t('comparison.current')}` : ''}`;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='workflow-comparison-dialog'>
        <DialogHeader>
          <DialogTitle>
            {t('comparison.title')} · {workflow.title ?? workflow.key}
          </DialogTitle>
          <DialogDescription>{t('comparison.description')}</DialogDescription>
        </DialogHeader>
        <div className='flex flex-wrap items-center gap-3'>
          <span>{t('comparison.direction')}</span>
          {(['added', 'removed', 'changed'] as const).map((status) => (
            <span key={status} className={`workflow-diff-label ${status}`}>
              {t(`comparison.${status}`)}{' '}
              {diff.nodes.filter((item) => item.status === status).length}
            </span>
          ))}
        </div>
        <div className='workflow-comparison-layout'>
          <nav
            ref={sidebarRef}
            className='workflow-comparison-sidebar'
            aria-label={t('comparison.changedNodes')}
          >
            <Button
              aria-pressed={selected === null}
              onClick={() => setSelected(null)}
            >
              {t('comparison.workflowFields')} ({diff.fields.length})
            </Button>
            {changes.map((item) => (
              <Button
                key={item.key}
                aria-pressed={selected === item.key}
                onClick={() => selectNode(item.key)}
              >
                <span className={`workflow-diff-label ${item.status}`}>
                  {item.connectionsChanged
                    ? t('comparison.connectionsChanged')
                    : t(`comparison.${item.status}`)}
                </span>{' '}
                <span className='min-w-0 break-words'>
                  {item.after?.title ||
                    item.before?.title ||
                    t('comparison.untitledNode')}
                </span>
              </Button>
            ))}
          </nav>
          <div className='workflow-comparison-main'>
            <div className='workflow-comparison-canvases'>
              <Button
                className='workflow-comparison-swap'
                aria-label={t('comparison.swap')}
                title={t('comparison.swap')}
                onClick={() => {
                  setLeftId(rightId);
                  setRightId(leftId);
                }}
              >
                <ArrowLeftRight className='size-4' aria-hidden='true' />
              </Button>
              {(
                [
                  {
                    side: 'before',
                    record: left,
                    source: leftDefinition,
                    set: setLeftId,
                  },
                  {
                    side: 'after',
                    record: right,
                    source: rightDefinition,
                    set: setRightId,
                  },
                ] as const
              ).map((pane) => (
                <section
                  key={pane.side}
                  aria-label={t(`comparison.${pane.side}`)}
                  className='min-w-0 rounded-lg border border-border'
                >
                  <div className='flex items-center gap-3 p-3'>
                    <span>{t(`comparison.${pane.side}`)}</span>
                    <Select
                      value={identity(pane.record)}
                      onValueChange={(value) => {
                        if (value) {
                          pane.set(value);
                          setSelected(null);
                        }
                      }}
                    >
                      <SelectTrigger aria-label={t(`comparison.${pane.side}`)}>
                        <SelectValue>{label(pane.record)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                        {revisions.map((item) => (
                          <SelectItem
                            key={identity(item)}
                            value={identity(item)}
                          >
                            {label(item)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <WorkflowCanvas
                    definition={pane.source}
                    differences={statuses}
                    changedConnections={changedConnections}
                    selectedNodeKey={selected}
                    onSelectNode={selectNode}
                    focusRequest={focusRequest}
                  />
                  {node &&
                  !pane.record.nodes.some((item) => item.key === selected) ? (
                    <p className='p-2 text-muted-foreground'>
                      {t('comparison.missingNode')}
                    </p>
                  ) : null}
                </section>
              ))}
            </div>
            {!changes.length && !diff.fields.length ? (
              <p role='status'>{t('comparison.noChanges')}</p>
            ) : null}
            <section
              aria-label={t('comparison.details')}
              className='rounded-lg border border-border'
            >
              <h3 className='p-3 font-medium'>
                {node
                  ? `${node.after?.title || node.before?.title || t('comparison.untitledNode')} · ${t(`comparison.${node.status}`)}`
                  : t('comparison.workflowFields')}
              </h3>
              <FieldDiff fields={node?.fields ?? diff.fields} />
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
