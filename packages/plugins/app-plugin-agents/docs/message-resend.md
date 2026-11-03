# Resend and edit a native user message

Native realtime sessions expose `RealtimeOnlineAgent.resend(options?: OnlineAgentResendOptions): Promise<number>`. The options type is exported from the public server and client chat entries. Runner sessions refuse resend, and background sessions do not expose it.

```ts
await chat.resend(); // Resend the latest saved user message.
await chat.resend({ messageId: userMessageId });
await chat.resend({
  messageId: userMessageId,
  input: { text: 'Revised request' },
});
const output = await chat.receive();
```

The target is always a user message. Omitting `messageId` selects the latest user at admission, even when an assistant reply follows it. The return value is the conversation's admitted sequence watermark, not proof that the answer has completed. Consume the existing SDK stream and reconcile business execution state as for an ordinary send.

## Irreversible history replacement

One locked admission transaction checks ownership, configuration and idle state, updates the target in place, physically deletes every later message and registers the new execution. The target retains its ID, sequence, creation time, attachment bindings and saved page/UI context; its revision and execution association change. The conversation watermark never decreases, so replacement output receives a sequence above the deleted suffix.

`input` may contain only `text`. Omitting it preserves the original parts. Supplying it replaces the original text parts with one part, preserves non-text parts and remaps private file indices. Text is limited to 50,000 Unicode code points. Whitespace-only text requires an original attachment. Current resource and attachment permissions are checked for the retained prefix before destructive writes; the deleted suffix is not prepared as model input.

There is no fork, historical version, undo or expected-history/CAS parameter. An idle request from an old tab may delete newer messages it has not seen. Deleting messages does not reverse completed tool or business effects. Regeneration may execute those operations again, and a new approval belongs to the new execution. Deleted messages' physical files are not automatically cleaned up by resend; existing retention and ownership rules remain in force.

A rejected admission leaves saved history unchanged. Once admitted, the edited input and deletion remain effective even if generation fails, stops or cannot finalize immediately. Stop, approval and finalization use the existing execution lifecycle, not a second executor.

## HTTP and browser clients

`POST /api/agents/conversations/:conversationId/resend` accepts the options object directly and returns the standard AI SDK UI message SSE response. The schema rejects complete browser history, attachment/context replacements, tool output and unknown fields. The route is declared in OpenAPI but deliberately excluded from generated CLI commands.

Use `useResendMessage(conversationId)` under the existing identity-keyed `ChatProvider`. UI operations pass an explicit user ID; assistant refresh uses only `metadata.sourceUserMessageId`, including an authorized ID read when that user is outside the current page. Missing linkage hides refresh instead of guessing the nearest user.

The coordinator uses the official SDK flows: original resend uses `regenerate({ messageId, body })`, and editing uses `sendMessage({ ...message, messageId, parts }, { body })`. The SDK may truncate its local working array before the POST. Do not substitute approval continuation with `sendMessage(undefined)`, stage another response stream, or use GET stream recovery to start a resend.

The hook resolves to `accepted`, `rejected` or `unknown`. A successful POST followed by a failed canonical read remains `accepted` with `needsSync`. Definitive rejection may restore the prior local display and preserve the edit. Unknown admission only rereads authoritative history; it never restores a stale suffix or automatically repeats the POST.

`conversation.historyReplaced` announces the accepted target, revision, execution and monotonic watermark. Shared views invalidate older reads, remove the suffix and retain only matching live output. Reconnects, manual synchronization and durable polling also reconcile known message IDs in bounded batches; deletion is inferred only when all requested batches succeed. Subscriber cancellation never invokes business Stop.

The installed Registry source supplies public-text copy, inline editing, direct edit/resend submission without a confirmation dialog, independent composer drafts and native/Runner visibility rules. Upgrade that source together with the plugin; an npm package update does not update an application's copied components.
