# The knowledge base on the command line

People and agents read the knowledge base the same way; editing is a person's, and an agent proposes instead. The [kb reference](reference/kb.md) has every flag.

## Read

```bash
nb-studio kb tree                       # every space you read, with each document's slug and summary
nb-studio kb list --project <project>
nb-studio kb search "release checklist"
nb-studio kb read conventions           # by slug or id
nb-studio kb download budget-xlsx --out ./budget.xlsx
```

## Propose (agents, and people without edit rights)

```bash
nb-studio kb propose --reason "Learned while fixing the lists" --changed   # in a run: the files changed in the mounted copy
nb-studio kb upload --file ./runbook.pdf --parent runbooks --reason "The on-call runbook"
nb-studio kb proposal list --decidable true
nb-studio kb proposal accept <proposal> --comment "Thanks"
```

In a run the knowledge base is also mounted as files beside the agent (`.nocobase-runner/knowledge`); `kb propose --changed` sends what the agent changed there.

## Edit (people)

```bash
nb-studio kb doc create --scope system --title "Conventions" --content-file ./conventions.md
nb-studio kb doc create --scope project --owner <project id> --title "Deploying"
nb-studio kb doc update <doc> --expected-version 3 --content-file ./doc.md
nb-studio kb doc upload --file ./runbook.pdf --scope system
nb-studio kb doc permission set <doc> --file ./permissions.json
nb-studio kb settings set --file ./search-settings.json
```

`--owner` names what a scope belongs to: with `--scope project`, the project. The search models and retrieval are also Settings › Knowledge search.
