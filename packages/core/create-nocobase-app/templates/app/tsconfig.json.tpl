{
  "extends": "./tsconfig.paths.json",
  "compilerOptions": {
    "esModuleInterop": true,
    "moduleResolution": "node",
    "jsx": "react",
    "target": "esnext",
    "module": "esnext",
    "allowJs": true,
    "noUnusedLocals": false,
    "preserveConstEnums": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "inlineSources": true,
    "resolveJsonModule": true,
    "declaration": true,
    "experimentalDecorators": true,
    "downlevelIteration": true,
    "baseUrl": ".",
    "paths": {
      "@{{{name}}}/app-*": [
        "packages/app/*/src"
      ],
      "@{{{name}}}/plugin-*": [
        "packages/plugins/plugin-*/src"
      ]
    }
  }
}
