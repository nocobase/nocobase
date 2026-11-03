import {
  BRIDGE_PROTOCOL_VERSION,
  type BridgeEvent,
  type ReportRequest,
  type ReportResponse,
} from '@nocobase/acp-bridge/protocol';
import type { AgentSessionsService } from '../../server/service.js';

/** Drive the current execution handshake in service tests that supply a stream of ACP observations. */
export async function bridgeReport(
  service: AgentSessionsService,
  userId: string,
  request: ReportRequest,
): Promise<ReportResponse> {
  const transcript = await service.listEvents(userId, request.sessionId, {
    after: 0,
    limit: 200,
  });
  const prompts = transcript.filter((event) => event.kind === 'prompt');
  const emitted: BridgeEvent[] = [];
  for (const event of request.events) {
    if (event.kind !== 'turnStarted' && event.kind !== 'turnEnded') {
      emitted.push(event);
      continue;
    }
    const prompt =
      prompts.find((prompt) => prompt.promptId === event.promptId) ??
      prompts.at(-1);
    if (!prompt) throw new Error('A turn needs a sent prompt');
    if (event.kind === 'turnStarted') {
      await service.claim(userId, {
        computerId: request.computerId,
        sessionId: request.sessionId,
        protocol: BRIDGE_PROTOCOL_VERSION,
        bridgeStartedAt: request.bridgeStartedAt,
        seq: prompt.seq,
        promptId: prompt.promptId,
      });
    } else
      emitted.push({ ...event, seq: prompt.seq, promptId: prompt.promptId });
  }
  return service.report(userId, { ...request, events: emitted });
}
