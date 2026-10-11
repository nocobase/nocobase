---
'@nocobase/agent-runner': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Remove a working directory once its subject's work is over, on the subject's status alone. Studio counts an issue as over when it is done or cancelled, whatever its pull requests are, and resolves directories without a known run by their issue key. The agents plugin no longer checks which runner worked on a subject, so legacy directories on any runner are decided too, and no longer asks bindings for commit evidence. The runner removes an ended directory with anything never pushed in it, and logs that it did; it still keeps one a run holds or used since the report, and one the second report no longer confirms as ended. Directories whose work goes on keep their unpushed-work protection. Runners released earlier still keep ended directories with unpushed work, since decisions now carry no commit evidence.
