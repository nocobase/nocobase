import type { ReactElement } from 'react';
import {
  matchPath,
  Navigate,
  useLocation,
  useResolvedPath,
} from 'react-router';
import {
  AISettingsShell,
  getActiveAISettingsTabKey,
} from '../ai-settings-shell.js';
import {
  knowledgeBaseListPath,
  llmServicePath,
  mcpServicePath,
  vectorDatabasesPath,
} from '../route-paths.js';
import AIEmployeePage from './ai-employee-page.js';

const legacyDestinations: Readonly<Record<string, string>> = {
  'llm-service': llmServicePath,
  mcp: mcpServicePath,
  'knowledge-base': knowledgeBaseListPath,
  'vector-database': vectorDatabasesPath,
};

export default function AISettingsPage(): ReactElement {
  const location = useLocation();
  const parentPath = useResolvedPath('.');
  const isParentEntry = matchPath(
    { path: parentPath.pathname, end: true },
    location.pathname,
  );
  const legacyKey = getActiveAISettingsTabKey(
    location.pathname,
    location.search,
    location.state,
  );
  const destination = Object.hasOwn(legacyDestinations, legacyKey)
    ? legacyDestinations[legacyKey]
    : undefined;
  if (isParentEntry && destination) {
    const search = new URLSearchParams(location.search);
    search.delete('tab');
    return (
      <Navigate
        to={{
          pathname: destination,
          search: search.toString(),
          hash: location.hash,
        }}
        replace
      />
    );
  }

  return (
    <AISettingsShell fill>
      <AIEmployeePage />
    </AISettingsShell>
  );
}
