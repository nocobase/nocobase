import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const { AIFormRegistry, createFormFillerInvoker } =
    await server.ssrLoadModule(
      "/registry/nocobase-ai/providers/form-registry.tsx"
    );

  const registry = new AIFormRegistry();
  const applied = [];
  const unregister = registry.register({
    id: "lead-form",
    title: "Lead form",
    fields: [
      { name: "company", type: "string" },
      {
        name: "priority",
        type: "string",
        enum: ["normal", "high"],
      },
      { name: "owner", type: "string", readonly: true },
    ],
    getValues: () => ({}),
    setValues: (values) => applied.push(values),
  });
  const invoke = createFormFillerInvoker(registry);

  const allowedContext = { allowedFormIds: ["lead-form"] };
  assert.deepEqual(
    await invoke(
      {
        form: "lead-form",
        data: { company: "Acme", priority: "high" },
      },
      allowedContext
    ),
    {
      status: "success",
      content:
        'Filled "Lead form". Please review the values and submit the form manually.',
      appliedFields: ["company", "priority"],
      skippedFields: [],
    }
  );
  assert.deepEqual(applied, [{ company: "Acme", priority: "high" }]);

  assert.deepEqual(
    await invoke(
      {
        form: "lead-form",
        data: { company: 42, owner: "Ada", unknown: true },
      },
      allowedContext
    ),
    {
      status: "error",
      content: 'No valid editable fields were provided for "Lead form".',
      appliedFields: [],
      skippedFields: [
        {
          name: "company",
          reason: "invalid",
          message: "Expected a string.",
        },
        {
          name: "owner",
          reason: "readonly",
          message: "This field is read-only.",
        },
        {
          name: "unknown",
          reason: "undeclared",
          message: "This field is not declared by the target form.",
        },
      ],
    }
  );

  assert.throws(
    () =>
      registry.register({
        id: "lead-form",
        title: "Duplicate lead form",
        fields: [],
        getValues: () => ({}),
        setValues: () => undefined,
      }),
    /already registered/
  );

  unregister();
  assert.deepEqual(
    await invoke(
      { form: "lead-form", data: { company: "Acme" } },
      allowedContext
    ),
    {
      status: "error",
      content: 'The target form "lead-form" is not available on this page.',
      appliedFields: [],
      skippedFields: [],
    }
  );

  assert.deepEqual(
    await invoke(
      { form: "lead-form", data: { company: "Acme" } },
      { allowedFormIds: [] }
    ),
    {
      status: "error",
      content:
        'The target form "lead-form" is not available in this conversation context.',
      appliedFields: [],
      skippedFields: [],
    }
  );

  console.log("AI Form filler regression tests passed");
} finally {
  await server.close();
}
