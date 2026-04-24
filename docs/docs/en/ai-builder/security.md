---
title: 'Security & Audit'
description: 'Learn about authentication methods, permission control strategies, recommended practices, and how to trace every operation record when AI Agents build with NocoBase.'
keywords: 'AI Builder,security,permissions,authentication,Token,OAuth,operation records,audit'
---

# Security & Audit

:::tip Prerequisites

Before reading this page, make sure you have installed the NocoBase CLI and completed initialization as described in [AI Builder Quick Start](./index.md).

:::

When users operate NocoBase through AI Agents via the [NocoBase CLI](../ai/quick-start.md), it's important to focus on authentication, permission control, and audit traceability to ensure clear operation boundaries and trackable processes.

## Authentication

AI Agents connect to NocoBase primarily through two authentication methods:

- **API key authentication**: Generate an API Key via the [API keys](/auth-verification/api-keys/) plugin, configure it in the CLI environment, and subsequent requests use it to access the API directly
- **OAuth authentication**: Complete a one-time OAuth login via the browser, then access the API as the current user

Both methods work with `nb` commands. The difference lies in the identity source, applicable scenarios, and risk control strategies.

### API Key Authentication

API keys are primarily used for automated, scripted, and long-running tasks, such as:

- Having an AI Agent periodically sync data
- Frequently calling `nb api` in development environments
- Using a fixed role to execute a class of clear, stable building tasks

The basic flow is:

1. Enable the API keys plugin in NocoBase and create an API Key
2. Bind a dedicated role to this API Key, rather than directly binding `root` or full admin permissions
3. Use `nb env add` to save the API address and Token to the CLI environment

For example:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

After configuration, the AI Agent can execute API calls through this environment:

```bash
nb api resource list --env local --resource users
```

This method is stable, suitable for automation, and doesn't require users to re-login each time. As long as the Token hasn't expired, anyone holding it can continuously access the system with the bound role's permissions. Therefore, special attention should be paid to:

- Bind Tokens only to dedicated roles
- Save them only in necessary CLI environments
- Rotate regularly — don't use "never expires" as the default option
- Delete and regenerate immediately if a leak is suspected

For more general guidelines, see the [NocoBase Security Guide](../security/guide.md).

### OAuth Authentication

OAuth is primarily used for tasks that need to be executed as the currently logged-in user, such as:

- Having the AI make one-time configuration adjustments for the current admin
- Needing to attribute operations to a specific logged-in user
- Not wanting to store high-privilege Tokens long-term

The basic flow is:

1. Add a CLI environment with `oauth` as the authentication method
2. Run `nb env auth`
3. The browser opens the authentication page — log in and complete authentication
4. The CLI saves the authentication information; subsequent `nb api` requests access NocoBase as the current user
5. If the user has multiple roles, specify one with `--role`

For example:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` launches the browser login flow. After success, the CLI saves the authentication information to the current environment configuration, and you can then continue having the AI Agent call `nb api`.

Under the current default implementation:

- OAuth access tokens are valid for **10 minutes**
- OAuth refresh tokens are valid for **30 days**

The CLI will prioritize using the refresh token to automatically refresh the session when the access token is about to expire. If the refresh token has expired, is unavailable, or the server didn't return a refresh token, you'll need to run `nb env auth` again.

OAuth's characteristic is that requests are typically executed under the current logged-in user and their role context, making audit records easier to trace back to the actual operator. This method is more suitable for operations involving human participation that require identity confirmation.

### Recommended Practices

Choose based on the following principles:

- **Development, testing, and automated tasks**: Prefer API keys, but be sure to bind dedicated roles
- **Production environments, human participation, strong identity attribution needed**: Prefer OAuth
- **High-risk operations**: Even if technically possible with Tokens, consider switching to OAuth, with a user who has the appropriate permissions completing authentication before execution

If there are no explicit requirements, follow these defaults:

- **Default to OAuth**
- **Only use API keys when automation, unattended operation, or batch execution is explicitly needed**

## Permission Control

The AI Agent itself has no "extra permissions" — what it can do depends entirely on the current identity and role being used.

In other words:

- When accessing via API key, the permission boundary is determined by the role bound to that Token
- When accessing via OAuth, the permission boundary is determined by the current logged-in user and their current role

The AI does not bypass NocoBase's ACL system. If a role doesn't have permissions for a certain data table, field, page, or plugin configuration, the AI Agent cannot successfully execute the corresponding command even if it knows it.

### Roles and Permission Strategies

It's recommended to prepare a dedicated role for the AI Agent rather than reusing existing admin roles.

This role typically only needs permissions in the following areas:

- Which data tables it can operate on
- Which actions it can perform, such as view, create, update, delete
- Whether it can access certain pages or menus
- Whether it can enter high-risk areas like system settings, plugin management, or permission configuration

For example, you could create an `ai_builder_editor` role that only allows:

- Managing CRM-related data tables
- Editing specified pages
- Triggering certain workflows
- No modifying role permissions
- No enabling, disabling, or installing plugins
- No deleting critical data tables

If you need the AI to help configure permissions, you can use the [ACL Configuration](./acl.md) Skill, but it's still recommended to have humans determine the permission boundaries first.

### Principle of Least Privilege

The principle of least privilege is especially important in AI building scenarios. Consider the following approach:

1. Create a dedicated role for the AI first
2. Initially only grant view permissions
3. Gradually add create, edit, and other necessary permissions based on tasks
4. Keep human control over high-risk operations like deletion, permission modification, and plugin management

For example:

- An AI used for content entry only needs view and create permissions on target data tables
- An AI used for page building only needs related page and UI configuration permissions
- An AI used for data modeling should only be given table structure modification permissions in the testing environment, not directly in production

It's not recommended to directly bind `root`, `admin`, or roles with global system configuration capabilities to an AI Agent. While this is simple to deploy, it significantly expands the permission exposure surface.

## Logs

In AI building scenarios, logs are used to support operation traceability and issue diagnosis.

Focus on the following two types of logs:

- **Request logs**: Record interface request paths, methods, status codes, response times, and request sources
- **Audit logs**: Record the executor, target resource, result, and related metadata of critical resource operations

When making requests via `nb api`, the CLI automatically includes the `x-request-source: cli` request header, allowing the server to identify that the request came from the CLI.

### Request Logs

Request logs record interface call information, including request paths, response status, response times, and source markers.

Log files are typically located at:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

In `nb api` call scenarios, request logs will include:

- `req.header.x-request-source`

This can be used to distinguish CLI requests from regular browser requests.

For request log directory and field descriptions, see [NocoBase Server Logs](../log-and-monitor/logger/index.md).

### Audit Logs

Audit logs record the executor, target resource, execution result, and related request information for critical operations.

For operations within the audit scope, logs will record:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

For example, when the AI calls `collections:apply`, `fields:apply`, or other audit-enabled write operations via the CLI, the audit log will record `x-request-source: cli`, making it easy to distinguish between UI operations and CLI-initiated operations.

For detailed audit log information, see [Audit Logs](../security/audit-logger/index.md).

## Security Recommendations

Here are several practical recommendations suited for AI building scenarios:

- Do not directly bind `root`, `admin`, or global system configuration roles to AI Agents
- Create dedicated roles for AI Agents and split permission boundaries by task
- Rotate API keys regularly — avoid long-term reuse of the same high-privilege Token
- Validate data modeling, page structure, and workflow changes in the testing environment first, then sync to production
- Enable and regularly check request logs and audit logs to ensure critical operations are traceable
- For high-risk operations like deleting data, modifying permissions, enabling/disabling plugins, and adjusting system configurations, confirm manually before execution
- If the AI needs to run long-term, prefer splitting into multiple low-privilege environments rather than concentrating on a single high-privilege environment

## Related Links

- [AI Builder Quick Start](./index.md) — Installation and environment setup
- [Environment Management](./env-bootstrap) — Environment checks, adding environments, and troubleshooting
- [ACL Configuration](./acl.md) — Configure roles, permission policies, and risk assessments
- [NocoBase CLI](../ai/quick-start.md) — Command-line tool for installing and managing NocoBase
- [NocoBase Security Guide](../security/guide.md) — Comprehensive security configuration recommendations
- [NocoBase Server Logs](../log-and-monitor/logger/index.md) — Request log directory and field descriptions
- [Audit Logs](../security/audit-logger/index.md) — Audit record fields and usage instructions
- [NocoBase MCP](../ai/mcp/index.md) — Connect AI Agents via the MCP protocol
