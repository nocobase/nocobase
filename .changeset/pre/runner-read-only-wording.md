---
'@nocobase/agent-runner': patch
---

A read-only step's notes now say what read-only means: change no tracked file, commit and push nothing. The agent may still prepare its checkout to run things there, such as initializing submodules, installing dependencies, building and running checks, which agents had read the old "change nothing" as forbidding.
