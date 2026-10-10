# @nocobase/studio-cli

`nb-studio`, the command line of NocoBase Studio (`packages/apps/studio`). It signs in to a Studio server and runs the business commands that server publishes, for people and for agents in a run. The commands are not in this package: they come from the server's command manifest, so one `nb-studio` works with every Studio it signs in to.

```bash
npm install -g @nocobase/studio-cli
nb-studio login --server https://studio.example.com
```

It needs Node.js 24 or newer. A Studio's install script installs it for you, at the version that Studio serves, and `nb-studio update` keeps it there.

The command, its state directory (`~/.nb-studio`), its environment prefix (`NB_STUDIO_`) and its sign-in client are declared under `nocobase.cli` in `package.json`, and `skills/` holds the Skill agents read to use it. Both mirror Studio's own `nocobase.cli` and `ai/skills/nb-studio-cli`, which `nocobase cli build` packs; a test keeps them equal, so change them in Studio and copy them here.
