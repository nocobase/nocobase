// Vitest defaults `testTimeout` to 5 seconds, which is a local-machine number. CI runs every package's suite in
// parallel on a shared runner, so a test that takes under a second on a developer's machine routinely takes several
// seconds there — the same work, waiting its turn for a core. Tests that legitimately grow, such as the template
// Client inspections that resolve every registered plugin, then cross 5 seconds on CI long before they are slow
// enough for anyone to notice locally, and they fail as timeouts rather than as the assertions they actually are.
// `app-template-default` broke this way once more plugins joined its Client
// composition: the inspection went from 1.6 to 5.1 seconds on CI while still finishing in under a second locally.
//
// Thirty seconds is what `app-plugin-workflow` and `app-plugin-file` had each already set for themselves for this
// reason. Raising the shared floor to it stops every package from rediscovering the problem one timeout at a time,
// and still bounds a genuinely hung test far inside the job's 45-minute limit. A package that needs longer than this
// still sets its own `testTimeout`; a local value always wins over the shared one.
export const sharedTestTimeout: number = 30_000;

// The same reasoning applies to `beforeAll`/`afterAll` hooks, whose default is also 10 seconds. Suites that start a
// server or a database in a hook are the slowest thing on a contended runner, and a hook timeout aborts the whole
// file rather than one test.
export const sharedHookTimeout: number = 30_000;
