import { useState, type ReactElement } from 'react';
import { GitBranchIcon, MousePointer2Icon } from 'lucide-react';
import {
  FlowDiagram,
  FlowDiagramStep,
  FlowDiagramTransitionNotes,
} from '#components/flow-diagram';
import { partitionFlowDiagramReturns } from '#components/flow-layout';

const nodes = [
  { id: 'draft', label: 'Draft', kind: 'initial' as const, visited: true },
  { id: 'review', label: 'In review', configurable: true, highlighted: true },
  { id: 'approved', label: 'Approved', kind: 'final' as const },
  { id: 'rejected', label: 'Rejected', kind: 'final' as const },
];
const edges = [
  {
    id: 'submit',
    source: 'draft',
    target: 'review',
    label: 'Submit',
    visited: true,
  },
  { id: 'withdraw', source: 'review', target: 'draft', label: 'Withdraw' },
  {
    id: 'approve',
    source: 'review',
    target: 'approved',
    label: 'Approve',
    highlighted: true,
  },
  {
    id: 'fast',
    source: 'review',
    target: 'approved',
    label: 'Auto approve',
  },
  { id: 'reject', source: 'review', target: 'rejected', label: 'Reject' },
  { id: 'assign', source: 'review', target: 'review', label: 'Reassign' },
];

const routes = partitionFlowDiagramReturns({ nodes, edges });

export function FlowDiagramDemo(): ReactElement {
  const [selected, setSelected] = useState(
    'Select a state or transition to inspect it.',
  );
  return (
    <div className='flex min-h-svh flex-col gap-4 bg-background p-4 text-foreground sm:p-6'>
      <div className='flex items-center gap-3'>
        <div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary'>
          <GitBranchIcon className='size-5' aria-hidden />
        </div>
        <div>
          <h1 className='text-base font-semibold'>Expense approval</h1>
          <p className='text-sm text-muted-foreground'>
            Explore states, transitions and execution progress.
          </p>
        </div>
      </div>
      <FlowDiagram
        nodes={nodes.map((node) => ({
          ...node,
          bare: true,
          width: 216,
          height: node.id === 'review' ? 64 : 44,
          minimapShape: node.id === 'review' ? 'card' : 'pill',
        }))}
        renderNode={(node, { active }) => (
          <FlowDiagramStep
            kind={
              node.id === 'draft'
                ? 'start'
                : node.id === 'review'
                  ? 'approval'
                  : node.id === 'rejected'
                    ? 'negative'
                    : 'success'
            }
            label={node.label}
            description={node.id === 'review' ? 'Manager approval' : undefined}
            progress={
              node.highlighted
                ? 'current'
                : node.visited
                  ? 'visited'
                  : 'unreached'
            }
          >
            {active && (
              <FlowDiagramTransitionNotes
                notes={routes.extraEdges
                  .filter(
                    (edge) =>
                      edge.source === node.id || edge.target === node.id,
                  )
                  .map((edge) => ({
                    id: edge.id,
                    label: edge.label,
                    detail: `${nodes.find((item) => item.id === edge.source)!.label} · ${edge.label} → ${nodes.find((item) => item.id === edge.target)!.label}`,
                    kind: edge.target === 'draft' ? 'start' : 'approval',
                  }))}
              />
            )}
          </FlowDiagramStep>
        )}
        edges={routes.edges}
        direction='DOWN'
        compact
        controls
        ariaLabel='Expense process'
        className='h-[min(36rem,70svh)] min-h-80'
        onNodeClick={(node) => setSelected(node.label)}
        onEdgeClick={(edge) => setSelected(edge.label ?? edge.id)}
      />
      <div
        className='flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground'
        aria-live='polite'
      >
        <MousePointer2Icon className='mt-0.5 size-4 shrink-0' aria-hidden />
        {selected}
      </div>
    </div>
  );
}
