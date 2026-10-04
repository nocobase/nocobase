/**
 * The fixed path segments registered beside a path parameter that carries a user- or configuration-chosen name. Hono
 * matches the first registered route, so a resource named like one of these could never be addressed; creating or
 * configuring one is refused instead. The routers register these segments from here, and `tests/app/api-routes.test.ts`
 * checks them against the route table, so the lists cannot drift from the routes.
 *
 * This module imports nothing, so configuration validation can read it without loading the routes.
 */

/** Fixed segments beside `/aiEmployees/{username}`. */
export const AI_EMPLOYEE_FIXED_SEGMENTS = {
  roster: 'roster',
  templates: 'templates',
} as const;

/** Fixed segments beside `/aiEmployee/mcpServers/{name}`. */
export const MCP_SERVER_FIXED_SEGMENTS = {
  tools: 'tools',
  testConnection: 'testConnection',
} as const;

export const AI_EMPLOYEE_RESERVED_USERNAMES: readonly string[] = Object.values(
  AI_EMPLOYEE_FIXED_SEGMENTS,
);

export const MCP_SERVER_RESERVED_NAMES: readonly string[] = Object.values(
  MCP_SERVER_FIXED_SEGMENTS,
);

/** The configured MCP server names that a fixed route segment would shadow. */
export function findReservedMCPServerNames(
  servers: Readonly<Record<string, unknown>> | undefined,
): string[] {
  return Object.keys(servers ?? {}).filter((name) =>
    MCP_SERVER_RESERVED_NAMES.includes(name),
  );
}

export function reservedMCPServerNameMessage(name: string): string {
  return `MCP server "${name}" uses a reserved name; rename it in config.yml ai.mcpServers. Reserved names: ${MCP_SERVER_RESERVED_NAMES.join(', ')}.`;
}
