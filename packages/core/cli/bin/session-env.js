const SESSION_ENV_SOURCES = [
  'CODEX_THREAD_ID',
  'OPENCODE_RUN_ID',
  'COPILOT_AGENT_SESSION_ID',
  'CLAUDE_CODE_SESSION_ID',
];
const PRESERVE_SYMLINKS_FLAG = '--preserve-symlinks';

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

export function normalizeNodeOptions(env = process.env) {
  const currentNodeOptions = String(env.NODE_OPTIONS ?? '').trim();
  const flags = currentNodeOptions ? currentNodeOptions.split(/\s+/) : [];

  if (!flags.includes(PRESERVE_SYMLINKS_FLAG)) {
    env.NODE_OPTIONS = [...flags, PRESERVE_SYMLINKS_FLAG].join(' ');
  }

  return env.NODE_OPTIONS;
}
