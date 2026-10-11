import { useState, type ReactElement } from 'react';
import { FlowDiagram } from '#components/flow-diagram';

const nodes = [
  { id: 'draft', label: 'Draft', visited: true },
  { id: 'review', label: 'In review', highlighted: true },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
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
    label: 'Auto approve · ⚙',
  },
  { id: 'reject', source: 'review', target: 'rejected', label: 'Reject' },
  { id: 'assign', source: 'review', target: 'review', label: 'Reassign' },
];

export function FlowDiagramDemo(): ReactElement {
  const [selected, setSelected] = useState(
    'Select a state or transition to inspect it.',
  );
  return (
    <div className='flex h-svh flex-col gap-3 bg-background p-6 text-foreground'>
      <p className='text-sm' aria-live='polite'>
        {selected}
      </p>
      <FlowDiagram
        nodes={nodes}
        edges={edges}
        ariaLabel='Expense process'
        className='min-h-0 flex-1'
        onNodeClick={(node) => setSelected(node.label)}
        onEdgeClick={(edge) => setSelected(edge.label ?? edge.id)}
      />
    </div>
  );
}
