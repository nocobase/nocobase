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
    "tar": "nocobase tar",
    "postinstall": "nocobase postinstall",
    "lint": "eslint ."
  },
  "resolutions": {
    "cytoscape": "3.28.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "antd": "5.12.8"
  },
  "dependencies": {
    "@nocobase/cli": "{{{version}}}",
    {{{dependencies}}}
  },
  "devDependencies": {
    "@nocobase/devtools": "{{{version}}}"
  }
}
