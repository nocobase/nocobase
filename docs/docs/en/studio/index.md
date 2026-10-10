# Studio

Studio brings projects, issues, and agent collaboration into one workspace. This guide follows a freight order management application from sign-in to its first project.

| What you want to do                                        | How to connect                          | What you need                                                       |
| ---------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Chat with the online Project assistant in Studio           | Add a model service                     | A service endpoint, API key, and chat model                         |
| Let a local coding agent manage Studio projects and issues | Use Studio in your agent                | A working local agent, the Studio CLI, and browser sign-in approval |
| Send work from Studio to a local coding agent              | Add a runtime and choose a Runner agent | A coding tool installed and signed in on the runtime machine        |

- **Studio CLI**: A command-line tool that local agents use to query and manage projects, issues, and other workspace content. Install it through **Use Studio in your agent** and authorize access with a Studio account.
- **Runner**: A task execution service running on a computer, server, or virtual machine. It receives tasks from Studio and invokes local coding tools. Connect it through **Add runtime**.

This example uses a local Codex subscription sign-in. It connects the CLI, adds a Runner, and then starts a conversation with the Project lead. No API model service is required for this route.

1. [Use Studio in your local agent](./connect-agent).
2. [Add a runtime](./runtimes).
3. [Create your first project](./first-project).
