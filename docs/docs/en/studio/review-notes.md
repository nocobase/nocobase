# Review notes

> Local review only. This page is excluded from the intended publication scope.

<details>
<summary>Project lead cannot create a project (fixed)</summary>

**Status: fixed.**

On 2026-10-10, the user confirmed that the missing project creation permission has been fixed online. As requested, the latest code was not pulled and the online behavior was not reverified. The earlier findings are retained below.

The first Northstar Logistics request failed: the signed-in administrator has `pm.projects/create`, but the built-in Project lead does not. The agent's reply attributes the refusal to the user's account. No project or task was created. The demo agent has been given this action locally to continue, without changing upstream source.

The earlier permission question is closed following the reported fix. The fix commit and implementation details have not been checked in this session.

</details>

## Online type and availability

Pending wording review. Project assistant shows its Online type even when its model is unavailable. The guide distinguishes the type from availability.

## Application initialization stops at repository preparation

**Status: workflow discussion pending; setup paused.**

The request was to create Northstar Logistics from scratch, initialize a NocoBase application, and provide home, Orders, Customers, and Drivers navigation. Executing the Project lead plan created the project and issue PM-1, assigned Developer, and started its run.

Developer found no linked repository or application source in its workspace. It requested a repository and moved the issue to Analysis. Solution designer then ran, and the issue ended in Blocked. No application code, branch, or pull request was created.

The plan covered project records and a regular development issue, but not the repository and application preparation needed for a new application. The missing prerequisite appeared only after dispatch, interrupting the onboarding flow. This does not establish that users must always create a repository first.

Discuss whether a dedicated initialization flow should create or select a repository and initialize the application before dispatch; where required Git information should be collected; and whether local initialization before repository linking is a supported product direction. At that discussion point no external repository had been created. The user subsequently authorized creating the private repository `Charls-Wu/northstar-logistics` on 2026-10-10. It has been cloned locally; Studio linking and a development retry remain pending.

### Proposal: choose a code location before application initialization

**Status: proposal only; not implemented.**

The source provides initialization routes for a new remote repository, an existing repository, or a directory on a Runner with an initialization prompt. GitHub is not a mandatory prerequisite for local onboarding; existing repositories may also be supplied by clone URL. The local initialization route has not been exercised in this walkthrough.

Proposed order: business request → distinguish a new application from an existing one → confirm a local directory or remote repository → approve the creation and initialization plan → prepare the code location and initialize the application → dispatch business development. A user should not have to create a GitHub repository before describing the application.

### Improve the Project lead instructions

The current instructions focus on reading, splitting, assigning, and progressing existing issues. Add guidance for starting from a new application request: confirm the code location, discover the dedicated initialization commands, prepare a reviewable plan, and wait for initialization and source availability before dispatching business development. Do not guess paths, repository visibility, or missing permissions; distinguish user permissions, agent capabilities, and Runner availability.

Instructions alone are insufficient. Verify that the agent can discover and invoke the initialization routes, has the required actions, and that dispatch validates the code location. The source declares `project setup create` and `project location add`; their actual availability to Project lead and support in operation plans have not yet been verified. No agent configuration has been changed in this discussion.

## Local Studio has no public address for GitHub CI

**Status: connectivity prerequisites pending; CI not yet tested.**

GitHub Webhooks and GitHub-hosted Actions need to reach Studio. The current local address is unreachable from GitHub, preventing later CI callbacks and deployment API access. Local application initialization can proceed first. The user chose to open a tunnel at the CI stage.

### Configuration proposal

This example created a project and an issue without linking a code location. The developer agent could not obtain application source, leaving initialization **Blocked**. Before executing a plan that wakes a developer agent:

1. **Prepare a repository or local directory.** Choose where the new application's source will live. For GitHub, create a dedicated repository under your account. Local development can use a directory accessible to the Runner. An initial repository commit does not initialize a NocoBase application.
2. **Add the project's code location in Studio.** Link the repository and branch, or select a Runner and local directory. Prepare read and push access for a private repository and confirm the executing Runner can access the location.
3. **Arrange application initialization.** Provide initialization instructions in project setup. Generate the application source, install dependencies, and confirm it starts before assigning home page, navigation, and business feature development.

**Before enabling GitHub CI builds and deployments, also configure:**

- **A public Studio address:** GitHub Webhooks and GitHub-hosted Actions must reach Studio. For local Studio, open a tunnel with a stable HTTPS address at this stage and configure Studio's public address accordingly. Local initialization can proceed before opening the tunnel.
- **The GitHub connection and Webhook:** Configure a GitHub App connection in Studio's Git settings and grant access to the repository. Set the App's Webhook URL to the connection's receiver address and configure the same Webhook secret on both sides. For a repository-level Webhook, use that repository's receiver address and secret. Receiver addresses depend on the actual connection or repository.
- **Actions credentials and workflow:** Use Studio's CI configuration to generate the repository's deployment API key and store it as the GitHub Actions secret **`NB_STUDIO_API_KEY`**. Set **`NB_STUDIO_URL`** in the workflow to the Studio address reachable from Actions (including `/main` in this example). Save the generated workflow under `.github/workflows/`, review its trigger branches and deployment environment, then enable it. Configure the Webhook secret and Actions API key separately.

Code location linking, application initialization, and CI integration are still pending in this demonstration. Complete the prerequisites before continuing with development below.
