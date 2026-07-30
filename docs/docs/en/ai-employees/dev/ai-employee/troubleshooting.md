---
title: "Troubleshooting AI Employee Plugin Development"
description: "Troubleshoot NocoBase AI employee Tools, Skills, built-in employees, and frontend Tool cards that are not registered or do not run."
keywords: "NocoBase,AI employee troubleshooting,Tool not registered,Skill not loaded,frontend card"
---

# Troubleshooting AI Employee Plugin Development

## The Tool is not registered

Check the following in order:

- The file is under `src/ai/**/tools/` within the plugin's build scope
- The file uses the `.ts` or `.js` extension
- It uses `export default defineTools(...)`
- The Tool file is not mistakenly named with the `.d.ts` extension
- There is no duplicate Tool name causing the later registration to be ignored
- The plugin has been rebuilt and loaded

## The Skill does not appear

Check the filename first. It must currently be:

```text
SKILLS.md
```

Also confirm that the frontmatter contains a stable `name` and `description`, and that the file is located at `src/ai/**/skills/<skill-name>/SKILLS.md`.

## The Skill loads but cannot call the Tool

Check the following:

- The Skill's `tools` list includes the Tool name
- The Tool is in the current Skill's `tools/` directory
- The Tool filename, `definition.name`, and Skill reference are consistent
- The `scope` is appropriate for the current binding method
- The Tool was not skipped because of a duplicate name

Binding a Tool only means the model can use it. If the Tool appears in the Skill but the model still does not call it, explicitly state the call timing, parameter requirements, and result-waiting step in the `SKILLS.md` workflow.

## The frontend card does not appear

The frontend registration name must exactly match the final server-side Tool name:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Also check:

- The custom plugin uses the `src/client-v2/` runtime
- The card is registered in the client plugin's `load()` method
- The ToolCall has entered a state supported by the card
- The card is not disabled by its `invokeStatus` check
- The client plugin has been rebuilt and loaded

## The Tool does not continue after clicking the card

Confirm that one of `approve()`, `edit()`, or `reject()` is called. To write the user's selection back into the arguments, use:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Also confirm that the server-side schema allows this field and that `invoke()` reads it.

## Changing `definition.name` has no effect

An automatically loaded Tool's name is determined by its filename or directory name. For example:

```text
src/ai/tools/developerChoice.ts
```

The final name is `developerChoice`. To rename it, also rename the file, Skill references, AI employee configuration, and frontend registration name.

## Related links

- [AI employee plugin development](./index.md) — Return to the development guide overview
- [Define a server-side Tool](./define-tool.md) — Check Tool naming and registration
- [Define a Skill](./define-skill.md) — Check Skill and Tool binding
- [Add frontend interaction to a Tool](./frontend-tool-ui.md) — Check ToolCall and frontend registration
