const SESSION_ENV_SOURCES = [
  'CODEX_THREAD_ID',
  'OPENCODE_RUN_ID',
  'COPILOT_AGENT_SESSION_ID',
  'CLAUDE_CODE_SESSION_ID',
];

export function resolveNormalizedSessionId(env = process.env) {
  for (const key of SESSION_ENV_SOURCES) {
    const value = String(env[key] ?? '').trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function normalizeSessionEnv(env = process.env) {
  const sessionId = resolveNormalizedSessionId(env);
  if (!sessionId) {
    return undefined;
  }

  env.NB_SESSION_ID = sessionId;
  return sessionId;
}
