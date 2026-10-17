import { useState, type ReactElement } from 'react';
import { GitBranchIcon, MousePointer2Icon } from 'lucide-react';
import { FlowDiagram } from '#components/flow-diagram';

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
        nodes={nodes}
        edges={edges}
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
