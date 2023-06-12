import { observer } from '@formily/react';

export const KanbanCardViewer: any = observer(
  (props: any) => {
    return props.children;
  },
  { displayName: 'KanbanCardViewer' },
);
