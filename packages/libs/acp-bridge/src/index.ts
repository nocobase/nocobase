// The bridge that runs a person's agent sessions on their own computer: `runBridge`, the agents it knows and how it
// finds them. The wire protocol, which the application's server and browser code read too, is `./protocol`.
export {
  AgentProcess,
  type AgentClientHandlers,
  type AgentProcessOptions,
} from './agent-process.js';
export {
  AGENTS,
  findProgram,
  resolveAgent,
  type AgentLauncher,
  type AgentSpec,
  type ResolvedAgent,
} from './agents.js';
export {
  BridgeHttpError,
  BridgeStopped,
  runBridge,
  type BridgeOptions,
} from './bridge.js';
export { allowedDir, isWithin, listFolders } from './folders.js';
export { BridgeSession, capStrings, type SessionContext } from './session.js';
