#!/usr/bin/env node
// Stands in for the real Goose AI agent's --help output, for the identify check's negative-match test: it must not
// reject a program whose surface looks like the agent, only one that looks like the unrelated migration tool.
console.log(`Usage: goose [COMMAND]

Commands:
    session     Start or resume interactive chat sessions
    run         Execute commands from an instruction or file
    configure   Configure Goose settings
    acp         Run as an ACP agent
    mcp         Run goose as an MCP server
    recipe      Manage recipe files
    schedule    Manage scheduled jobs
`);
