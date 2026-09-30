import type { AIEmployeeClient } from '../../ai-employee-client.js';
import type {
  MCPRecord,
  MCPToolEntry,
  MCPTransport,
} from '../../mcp-service.js';

export interface MCPServicesContext {
  readonly ai: AIEmployeeClient;
  readonly servers: readonly MCPRecord[];
  readonly tools: Readonly<Record<string, MCPToolEntry[]>>;
  readonly loading: boolean;
  readonly loadError: string | undefined;
  readonly onPermissionSaved: (
    serverName: string,
    toolName: string,
    permission: 'ASK' | 'ALLOW',
  ) => void;
}

export const transportLabels: Record<MCPTransport, string> = {
  stdio: 'Stdio',
  http: 'mcp.transportHttp',
  sse: 'mcp.transportSse',
};
