# Organisation tests

Part of [the organisation dimension](../organization.md). Follow [testing and verification](../testing.md) for the layers and fixtures.

## Test against the real application

Most of the matrix needs real authorization routes and middleware. Use `createAppTest({ createServer: createStandaloneServer })` from `@nocobase/app-testing/server` with the application's own `server/standalone.ts`. Confirm its runtime registers authentication, authorization and, for the cross-department case, sharing-rules. The fixture installs their migrations and seeds on isolated databases on the selected test dialect; do not choose a dialect or configure a driver here. Sign in seeded users with `signIn()` from `@nocobase/app-plugin-authentication/testing` and create permission sets and assignments through `authz.permissionSets`. Use `scope: 'test'` for cases that need fresh data, or explicitly remove each test's assignments when sharing the file-scoped application. See [testing through the whole application](../testing.md#testing-through-the-whole-application) for the fixture and sign-in example.

## Test matrix

| Area                  | Cases                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration             | `up` then `down` against a real database; the physical tables, unique and index exist and are gone again                                                                                    |
| `resolveFor`          | Direct departments plus ancestors; a disabled membership, a disabled department and a disabled ancestor each drop out; a cycle terminates                                                   |
| `filterActive`        | Inside a transaction that disables a department, the id drops out through that transaction, and the fallback connection is never used; after rollback the id is active again                |
| Inheritance           | A set assigned to a parent department reaches a member of a child department on a new request                                                                                               |
| Revocation            | Removing the member, disabling the department and revoking the department's assignment each end the inherited access on their own, while a direct assignment to the same user keeps working |
| Routes                | 401 without a session, 403 without the settings item (and `update` for writes), 200 with it; invalid input answers 400                                                                      |
| Selection             | List and resolve answer descriptor titles unchanged; the search matches a seeded title in every shipped language                                                                            |
| Attribute sync        | Adding, removing or re-prioritising a membership, disabling a department and changing its attribute each rewrite the business row in the same transaction                                   |
| Accounts              | Each seeded account sees exactly what its departments and direct roles allow in the business module's own endpoints                                                                         |
| Cross-department case | A sharing rule that lists a department lets its members reach another department's records only for the action they already hold, and removing either required scope denies it again        |
| Refresh               | Each membership write notifies exactly the users it changed, after commit                                                                                                                   |

For the cross-department case, use the department record access and sharing rule from [scope business records by department](subjects.md#scope-business-records-by-department). Run the business endpoint, not only the inspector.
