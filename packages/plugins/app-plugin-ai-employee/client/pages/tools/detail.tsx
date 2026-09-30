import type { ReactElement } from 'react';
import { useOutletContext, useParams } from 'react-router';
import { ToolDetailsDrawer } from '../../components/tool-details-drawer.js';
import type { ManagedToolSummary } from '../../tools-management-service.js';

export default function ToolDetailPage(): ReactElement {
  const { toolName = '' } = useParams<'toolName'>();
  const tools = useOutletContext<ManagedToolSummary[]>();
  return (
    <ToolDetailsDrawer
      key={toolName}
      toolName={toolName}
      summary={tools.find((tool) => tool.name === toolName)}
    />
  );
}
