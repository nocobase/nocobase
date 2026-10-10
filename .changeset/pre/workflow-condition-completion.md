---
'@nocobase/app-plugin-dag-flow': patch
---

Save condition nodes as resolved before executing their selected branch, preserving their results when branches wait, fail, or terminate the workflow.

Remove the nextKey instruction result and execution summary fields. Ordinary execution follows the node graph's downstream link; branching instructions transfer execution directly to their selected branch.
