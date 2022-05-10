{
  "name": "{{{name}}}",
  "private": true,
  "workspaces": [
    "packages/app/*",
    "packages/plugins/*"
  ],
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "rimraf -rf packages/*/*/{lib,esm,es,dist}",
    "build": "nocobase build",
    "test": "nocobase test",
    "lint": "eslint .",
    "postinstall": "nocobase umi generate tmp"
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
    "@nocobase/devtools": "{{{version}}}",
    "commander": "^9.2.0",
    "cross-env": "^7.0.3",
    "glob": "^7.1.3",
    "prettier": "^2.2.1",
    "pretty-format": "^24.0.0",
    "pretty-quick": "^3.1.0",
    "rimraf": "^3.0.0"
  }
}
