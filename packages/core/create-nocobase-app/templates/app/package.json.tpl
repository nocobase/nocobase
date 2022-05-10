{
  "name": "{{{name}}}",
  "private": true,
  "workspaces": [
    "packages/app/*",
    "packages/plugins/*"
  ],
  "scripts": {
    "start": "nocobase dev",
    "start-pm2": "nocobase start --pm2",
    "start-docs": "dumi dev",
    "clean": "rimraf -rf packages/*/*/{lib,esm,es,dist} && lerna clean",
    "build": "yarn build-tool && yarn nocobase build",
    "build-docs": "dumi build",
    "build-tool": "cd packages/core/build && yarn build",
    "test": "nocobase test",
    "lint": "eslint .",
    "version:alpha": "lerna version prerelease --preid alpha --force-publish=* --no-git-tag-version -m \"chore(versions): publish packages %s\"",
    "release:force": "lerna publish from-package --yes",
    "release": "lerna publish"
  },
  "resolutions": {
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0"
  },
  "config": {
    "ghooks": {
      "commit-msg": "commitlint --edit"
    }
  },
  "dependencies": {
    "@nocobase/cli": "{{{version}}}",
    {{{dependencies}}}
  },
  "devDependencies": {
    "@commitlint/cli": "^16.1.0",
    "@commitlint/config-conventional": "^16.0.0",
    "@commitlint/prompt-cli": "^16.1.0",
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0",
    "commander": "^9.2.0",
    "cross-env": "^7.0.3",
    "dumi": "^1.1.33",
    "ghooks": "^2.0.4",
    "glob": "^7.1.3",
    "prettier": "^2.2.1",
    "pretty-format": "^24.0.0",
    "pretty-quick": "^3.1.0",
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "rimraf": "^3.0.0",
    "supertest": "^6.1.6"
  }
}
