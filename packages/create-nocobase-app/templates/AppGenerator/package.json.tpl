{
  "name": "nocobase-app",
  "private": true,
  "scripts": {
    "start": "concurrently \"npm run start-server\" \"umi dev\"",
    "start-client": "umi dev",
    "start-server": "ts-node-dev -r dotenv/config --project tsconfig.apis.json ./src/apis/index.ts",
    "nocobase": "ts-node -r dotenv/config --project tsconfig.apis.json ./src/apis/index.ts",
    "serve": "node -r dotenv/config ./lib/apis/index.js",
    "build": "npm run build-server && npm run build-client",
    "build-client": "umi build",
    "build-server": "rimraf -rf lib && tsc --project tsconfig.apis.json",
    "postinstall": "node ./umi.js generate tmp",
    "prettier": "prettier --write '**/*.{js,jsx,tsx,ts,less,md,json}'",
    "test": "umi-test",
    "test:coverage": "umi-test --coverage"
  },
  "gitHooks": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.{js,jsx,less,md,json}": [
      "prettier --write"
    ],
    "*.ts?(x)": [
      "prettier --parser=typescript --write"
    ]
  },
  "dependencies": {
    {{#quickstart}}"sqlite3": "^5.0.2",
    {{/quickstart}}"@nocobase/plugin-action-logs": "^{{{ version }}}",
    "@nocobase/plugin-china-region": "^{{{ version }}}",
    "@nocobase/plugin-client": "^{{{ version }}}",
    "@nocobase/plugin-collections": "^{{{ version }}}",
    "@nocobase/plugin-export": "^{{{ version }}}",
    "@nocobase/plugin-file-manager": "^{{{ version }}}",
    "@nocobase/plugin-multi-apps": "^{{{ version }}}",
    "@nocobase/plugin-permissions": "^{{{ version }}}",
    "@nocobase/plugin-system-settings": "^{{{ version }}}",
    "@nocobase/plugin-ui-router": "^{{{ version }}}",
    "@nocobase/plugin-ui-schema": "^{{{ version }}}",
    "@nocobase/plugin-users": "^{{{ version }}}",
    "@nocobase/server": "^{{{ version }}}"
  },
  "devDependencies": {
    "@nocobase/client": "^{{{ version }}}",
    "@types/react": "^17.0.0",
    "@types/react-dom": "^17.0.0",
    "@umijs/preset-react": "1.x",
    "@umijs/test": "^3.4.15",
    "concurrently": "^5.3.0",
    "cross-env": "^7.0.3",
    "micromark": "~2.11.0",
    "mockjs": "^1.1.0",
    "prettier": "^2.2.0",
    "react": "17.x",
    "react-dom": "17.x",
    "ts-node-dev": "^1.1.8",
    "typescript": "4.1.5",
    "umi": "^3.0.0",
    "yorkie": "^2.0.0"
  }
}
