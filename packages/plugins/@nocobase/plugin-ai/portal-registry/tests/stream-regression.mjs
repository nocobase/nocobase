import assert from "node:assert/strict";
import { createServer } from "vite";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const encodeSSE = (events) => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")
        )
      );
      controller.close();
    },
  });
};

const collectStream = async (stream) => {
  const result = [];
  for await (const chunk of stream) result.push(chunk);
  return result;
};

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const { StreamCoalescer } = await server.ssrLoadModule(
    "/registry/nocobase-ai/providers/stream-coalescer.ts"
  );
  const { NocoBaseChatTransport } = await server.ssrLoadModule(
    "/registry/nocobase-ai/providers/chat-transport.ts"
  );
  const { SubAgentStreamAccumulator } = await server.ssrLoadModule(
    "/registry/nocobase-ai/providers/sub-agent-stream.ts"
  );
  const { NocoBaseClient } = await server.ssrLoadModule(
    "/src/lib/nocobase/client.ts"
  );

  {
    const client = new NocoBaseClient("http://localhost:13001/api");
    assert.equal(
      client.resolveUrl("/files/main/main/aiFiles/5.png?preview=1"),
      "http://localhost:13001/files/main/main/aiFiles/5.png?preview=1"
    );
    assert.equal(
      client.resolveUrl("https://cdn.example.com/file.png"),
      "https://cdn.example.com/file.png"
    );
  }

  {
    const flushed = [];
    const coalescer = new StreamCoalescer({
      interval: 20,
      maxSize: 100,
      getSize: (value) => value.length,
      merge: (current, incoming) => current + incoming,
      onFlush: (key, value) => flushed.push([key, value]),
    });
    coalescer.push("message", "hello ");
    coalescer.push("message", "world");
    await wait(35);
    assert.deepEqual(flushed, [["message", "hello world"]]);
  }

  {
    const seedMessage = {
      id: "assistant-existing",
      role: "assistant",
      parts: [
        {
          type: "data-subAgent",
          id: "sub-1",
          data: {
            sessionId: "sub-1",
            username: "viz",
            status: "pending",
            messages: [
              {
                id: "sub-message",
                role: "assistant",
                parts: [{ type: "text", text: "saved ", state: "done" }],
              },
            ],
          },
        },
      ],
    };
    const accumulator = new SubAgentStreamAccumulator(seedMessage);
    const [chunk] = accumulator.process({
      type: "content",
      body: "tail",
      from: "sub-agent",
      sessionId: "sub-1",
      username: "viz",
    });
    assert.equal(chunk.data.messages.length, 1);
    assert.equal(chunk.data.messages[0].parts[0].text, "saved tail");
  }

  {
    const toolCallId = "report-tool";
    const events = [
      ...Array.from({ length: 100 }, (_, index) => ({
        type: "tool_call_chunks",
        from: "main-agent",
        sessionId: "conversation-1",
        body: [
          index === 0
            ? {
                id: toolCallId,
                name: "businessReportGenerator",
                args: "{",
              }
            : { id: toolCallId, args: "x" },
        ],
      })),
      { type: "stream_end", from: "main-agent", sessionId: "conversation-1" },
    ];
    const service = {
      resumeConversationStream: async () => encodeSSE(events),
    };
    const transport = new NocoBaseChatTransport({
      service,
      getContext: () => ({
        sessionId: "conversation-1",
        employee: { username: "atlas", nickname: "Atlas" },
        model: { value: "test", label: "Test" },
      }),
    });
    transport.prepareConversationResume([
      { id: "assistant-existing", role: "assistant", parts: [] },
    ]);
    const chunks = await collectStream(await transport.reconnectToStream());
    const start = chunks.find((chunk) => chunk.type === "start");
    const toolDeltas = chunks.filter(
      (chunk) => chunk.type === "tool-input-delta"
    );
    assert.equal(start.messageId, undefined);
    assert.ok(toolDeltas.length < 10, `received ${toolDeltas.length} deltas`);
    assert.equal(
      toolDeltas.reduce((size, chunk) => size + chunk.inputTextDelta.length, 0),
      100
    );
  }

  {
    let request;
    const service = {
      sendMessagesStream: async (input) => {
        request = input;
        return encodeSSE([
          { type: "content", body: "ok", from: "main-agent" },
          { type: "stream_end", from: "main-agent" },
        ]);
      },
    };
    const transport = new NocoBaseChatTransport({
      service,
      getContext: () => ({
        sessionId: "conversation-context",
        employee: { username: "mira", nickname: "Mira" },
        model: { value: "test", label: "Test" },
      }),
    });
    await collectStream(
      await transport.sendMessages({
        messages: [
          {
            id: "user-context",
            role: "user",
            metadata: {
              workContext: [
                {
                  type: "page-element",
                  id: "customer-form",
                  title: "Customer form",
                  content: { values: { name: "Northwind" } },
                },
              ],
            },
            parts: [{ type: "text", text: "Review this form" }],
          },
        ],
      })
    );
    assert.deepEqual(request.messages[0].workContext, [
      {
        type: "page-element",
        id: "customer-form",
        title: "Customer form",
        content: { values: { name: "Northwind" } },
      },
    ]);
  }

  console.log("AI stream regression tests passed");
} finally {
  await server.close();
}
