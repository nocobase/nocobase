{
  "name": "{{{packageName}}}",
  "version": "{{{packageVersion}}}",
  "main": "lib/server/index.js",
  "scripts": {
    "build": "father build",
    "watch": "father dev"
  },
  "files": [
    "lib",
    "src",
    "README.md",
    "README.zh-CN.md",
    "CHANGELOG.md",
    "server.js",
    "server.d.ts",
    "client.js",
    "client.d.ts"
  ],
  "dependencies": {},
  "devDependencies": {
    "father": "^4.2.3",
    "@nocobase/server": "{{{nocobaseVersion}}}",
    "@nocobase/test": "{{{nocobaseVersion}}}"
  }
}
