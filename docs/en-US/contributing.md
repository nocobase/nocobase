# Contributing

- Fork the source code to your own repository
- Modify source code
- Submit pull request

## Download 

```bash
# Replace the following git address with your own repo
git clone https://github.com/nocobase/nocobase.git
cd nocobase
yarn install
```

## Development and Testing

```bash
# Install and start the application
yarn dev
# Run all tests
yarn test
# Run all test files in the folder
yarn test <dir>
# Run a single test file
yarn test <file>
```

## Documentation preview

```bash
# Start documentation
yarn doc --lang=zh-CN
yarn doc --lang=en-US
```

The documentation is in the docs directory and follows Markdown syntax

```bash
|- /docs/
  |- en-US
  |- zh-CN
```

## Others

For more CLI instructions, please [refer to the NocoBase CLI chapter](./development/nocobase-cli.md)
