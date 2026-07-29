import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const {
    createAIPageContextReference,
    getAIWorkContextRequiredTools,
    mergeAIRequiredTools,
  } = await server.ssrLoadModule(
    "/registry/nocobase-ai/providers/page-context.tsx"
  );

  const formContext = createAIPageContextReference({
    id: "lead-form",
    title: "Lead form",
    kind: "form",
  });
  assert.deepEqual(formContext, {
    type: "page-element",
    id: "lead-form",
    title: "Lead form",
    kind: "form",
  });
  assert.deepEqual(getAIWorkContextRequiredTools([formContext]), [
    "formFiller",
  ]);
  assert.deepEqual(
    mergeAIRequiredTools(
      { skills: ["lead-review"], tools: ["inspect-record"] },
      ["formFiller", "inspect-record"]
    ),
    {
      skills: ["lead-review"],
      tools: ["inspect-record", "formFiller"],
    }
  );
  assert.equal(mergeAIRequiredTools(undefined, []), undefined);

  console.log("AI page context regression tests passed");
} finally {
  await server.close();
}
