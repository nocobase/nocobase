{
  "name": "{{{name}}}",
  "private": true,
  "workspaces": [
    "packages/*/*",
    "packages/*/*/*"
  ],
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "nocobase": "nocobase",
    "pm": "nocobase pm",
    "dev": "nocobase dev",
    "start": "nocobase start",
    "clean": "nocobase clean",
    "build": "nocobase build",
    "test": "nocobase test",
    "e2e": "nocobase e2e",
    "postinstall": "nocobase postinstall",
    "lint": "eslint ."
  },
  "resolutions": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  },
  "dependencies": {
    "@nocobase/cli": "{{{version}}}",
    {{{dependencies}}}
  },
  "devDependencies": {
    "@nocobase/devtools": "{{{version}}}"
  }
}
