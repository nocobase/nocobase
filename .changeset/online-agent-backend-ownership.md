---
'@nocobase/app-plugin-agents': minor
---

Extract Native execution ownership behind the complete OnlineAgentBackend contract and delegate backend selection, session creation, restoration and configuration from OnlineAgentService. Replace the Runner-specific backend interface and forwarding wrapper with one concrete Runner session, require explicit unsupported-capability rejection, preserve accepted response ownership across failed sends, retain deferred HTTP configuration boundaries, pin shared recovery to accepted submissions and drain Runner admissions before shutdown without cancelling or redispatching remote work.

Use admission-only Runner receipts to avoid treating post-commit conversation projection failures as failed inputs. The server-side `ConversationService.sendRealtime()` return contract is now `{ seq, run }`; ordinary conversation send and HTTP response contracts are unchanged.
