{
  "private": true,
  "scripts": {
    "start": "concurrently \"nodemon\" \"umi dev\"",
    "build": "father-build && umi build",
    "postinstall": "umi generate tmp",
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
    "@ant-design/pro-layout": "^5.0.12",
    "@umijs/preset-react": "1.x",
    "@umijs/test": "^3.2.23",
    "@nocobase/api": "^{{{ version }}}",
    "@nocobase/ui": "^{{{ version }}}",
    "@nocobase/father-build": "^{{{ version }}}",
    "@nocobase/plugin-collections": "^{{{ version }}}",
    "concurrently": "^5.3.0",
    "lint-staged": "^10.0.7",
    "nodemon": "^2.0.6",
    "prettier": "^1.19.1",
    "react": "^16.12.0",
    "react-dom": "^16.12.0",
    "umi": "^3.2.23",
    "yorkie": "^2.0.0"
  }
}
