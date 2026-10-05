---
'@nocobase/create-app': patch
---

A generated application's `.gitignore` no longer ignores `.nocobase/`. `hub remote add` keeps the Hub Apps an application deploys to in `.nocobase/hub.json`, which is meant to be committed so every checkout and CI deploys to the same place; ignoring the directory kept the file out of every commit. An application generated earlier keeps its own `.gitignore`: remove the `/.nocobase/` line before adding a remote, which `hub remote add` also warns about.
