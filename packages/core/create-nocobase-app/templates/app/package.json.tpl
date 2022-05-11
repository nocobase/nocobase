{
  "name": "{{{name}}}",
  "private": true,
  "workspaces": [
    "packages/*/*",
  ],
  "scripts": {
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "lint": "eslint .",
    "postinstall": "nocobase umi generate tmp"
  },
  "resolutions": {
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0"
  },
  "dependencies": {
    "@nocobase/cli": "{{{version}}}",
    {{{dependencies}}}
  },
  "devDependencies": {
    "@nocobase/devtools": "{{{version}}}"
  }
}
