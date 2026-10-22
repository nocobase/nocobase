# A minimal dataset adapter

This is a typed application adapter pattern, not a built-in project/task schema. Implement the three business methods against the application's existing services and collections, and supply grants from its authorization declarations. The example introduces no plugin-private imports, database tables or network calls. Start with one language; add languages only when the requested demo needs them.

Use one account list for both `accounts()` and `createAccount()`. Set explicit passwords that meet the installed authentication policy; do not rely on the username-derived default for short usernames. Every listed account is publicly enterable when quick sign-in is enabled. Keep management access on the real administrator, separate from visitor roles.

The complete [typed dataset source](../assets/minimal-demo/server/demo/dataset.ts) and [business implementation](../assets/minimal-demo/server/demo/business.ts) ship with this Skill. Follow the [minimal application example](minimal-example.md) for migration, provider, permissions, API, page and runnable verification. Use the source as the maintained example; do not copy a second implementation from prose.

Register the result from an application provider after its business services exist. Import the original `demoDataToken` from `@nocobase/app-plugin-demo-mode/server/tokens`, then call `this.app.container.resolve(demoDataToken).register(createDemoDataset(business))`. Registration declares the dataset; it does not generate records. Follow the application's provider registration convention rather than adding a second runtime entry.

`clearBusinessData()` must stop or cancel active demo work and remove dependent records before parents, plus the associated files and caches. It clears all business data in the dedicated demo instance, including visitor additions and rows created before a failed tracking call. It must tolerate repeated calls and partially generated data. Preserve system identities, permissions and plugin infrastructure; the plugin handles its tracked accounts and Permission Sets. Do not replace this method with deletion of tracked IDs alone.

If real services create a pending task and then complete it through a lifecycle transition, adapt `createTask()` to that sequence; do not bypass validation to force the example's state field into the database. Likewise adapt role scopes and grants to the application's actual permissions. For a multilingual demo, derive both display accounts and generated content from the same language-specific factory.

For shared sample installation, extract the business generation into an application function whose arguments contain the people, clock and business services it needs. The ordinary sample entry supplies its own identity helpers; the demo entry adapts `DemoImportContext`. Do not require a sample installation to start the demo lifecycle merely to reuse fictional content.

## Run and verify

1. Register the configuration factory and set the dedicated deployment's demo mode. Leave online chat disabled when no AI feature is needed. Start the application with its normal migration and initialization workflow.
2. Mount `DemoModeSettings`, grant the real administrator data read/manage access, and choose Generate. Alternatively run `pnpm nocobase demo-mode data import --actor <administrator-id> --language en-US --dry-run`, then the same command with `--force` instead of `--dry-run`. Replace the actor placeholder with an existing administrator ID.
3. Check that generation completes, the project and both tasks appear with recent dates, and both visitor accounts can enter through `/demo-sign-in` and see the records allowed by their grants.
4. Enable only the visitor writes needed by this demo. Add one visitor task, reset, and verify the original story returns, the visitor task is gone and accounts remain reusable. Clear and generate once more to verify the separate account-disable/reuse path.
5. Report the application entry URL, visitor roles, permitted interactions and any unverified behavior. Add model/tool/Runner examples only if they are part of the requested demonstration.
