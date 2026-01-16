# NocoBase Documentation

This repository contains the official NocoBase documentation with multilingual support.

## Architecture

The documentation uses a **git submodule** approach for multilingual content:

- **Main repository**: Contains English (`en`) and Chinese (`cn`) documentation
- **Language submodules**: Each additional language is maintained in a separate repository

```
docs/
├── docs/
│   ├── en/                    # English (in main repo)
│   ├── cn/                    # Chinese (in main repo)
│   ├── ja/ → submodule        # Japanese
│   ├── ko/ → submodule        # Korean
│   ├── de/ → submodule        # German
│   └── ...                    # Other languages
├── theme/
├── rspress.config.ts
└── package.json
```

## Language Repositories

| Language | Repository |
|----------|------------|
| Japanese (ja) | [Albert-mah/nocobase-docs-ja](https://github.com/Albert-mah/nocobase-docs-ja) |
| Korean (ko) | [Albert-mah/nocobase-docs-ko](https://github.com/Albert-mah/nocobase-docs-ko) |
| German (de) | [Albert-mah/nocobase-docs-de](https://github.com/Albert-mah/nocobase-docs-de) |
| French (fr) | [Albert-mah/nocobase-docs-fr](https://github.com/Albert-mah/nocobase-docs-fr) |
| Spanish (es) | [Albert-mah/nocobase-docs-es](https://github.com/Albert-mah/nocobase-docs-es) |
| Portuguese (pt) | [Albert-mah/nocobase-docs-pt](https://github.com/Albert-mah/nocobase-docs-pt) |
| Russian (ru) | [Albert-mah/nocobase-docs-ru](https://github.com/Albert-mah/nocobase-docs-ru) |
| Italian (it) | [Albert-mah/nocobase-docs-it](https://github.com/Albert-mah/nocobase-docs-it) |
| Turkish (tr) | [Albert-mah/nocobase-docs-tr](https://github.com/Albert-mah/nocobase-docs-tr) |
| Ukrainian (uk) | [Albert-mah/nocobase-docs-uk](https://github.com/Albert-mah/nocobase-docs-uk) |
| Vietnamese (vi) | [Albert-mah/nocobase-docs-vi](https://github.com/Albert-mah/nocobase-docs-vi) |
| Indonesian (id) | [Albert-mah/nocobase-docs-id](https://github.com/Albert-mah/nocobase-docs-id) |
| Thai (th) | [Albert-mah/nocobase-docs-th](https://github.com/Albert-mah/nocobase-docs-th) |
| Polish (pl) | [Albert-mah/nocobase-docs-pl](https://github.com/Albert-mah/nocobase-docs-pl) |
| Dutch (nl) | [Albert-mah/nocobase-docs-nl](https://github.com/Albert-mah/nocobase-docs-nl) |
| Czech (cs) | [Albert-mah/nocobase-docs-cs](https://github.com/Albert-mah/nocobase-docs-cs) |
| Arabic (ar) | [Albert-mah/nocobase-docs-ar](https://github.com/Albert-mah/nocobase-docs-ar) |
| Hebrew (he) | [Albert-mah/nocobase-docs-he](https://github.com/Albert-mah/nocobase-docs-he) |
| Hindi (hi) | [Albert-mah/nocobase-docs-hi](https://github.com/Albert-mah/nocobase-docs-hi) |
| Swedish (sv) | [Albert-mah/nocobase-docs-sv](https://github.com/Albert-mah/nocobase-docs-sv) |

## Getting Started

### Clone with English and Chinese only (fastest)

```bash
git clone https://github.com/nocobase/nocobase.git
cd nocobase/docs
yarn install
yarn dev
```

### Load specific languages on demand

```bash
# Load Japanese and Korean
git submodule update --init docs/docs/ja docs/docs/ko

# Start dev server (will include en, cn, ja, ko)
yarn dev
```

### Load all languages

```bash
git submodule update --init --recursive
yarn dev
```

## Development

### Prerequisites

- Node.js 18+
- Yarn

### Commands

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

### Dynamic Locale Detection

The `rspress.config.ts` automatically detects available languages by checking which directories have content. Languages from uninitialized submodules are automatically excluded from the build.

```typescript
// Only languages with content will be included
[rspress] Available locales: en, cn, ja, ko
```

## Contributing

### Contributing to English/Chinese docs

1. Fork the main repository
2. Make your changes in `docs/en/` or `docs/cn/`
3. Submit a Pull Request

### Contributing to other languages

1. Fork the corresponding language repository (e.g., `nocobase-docs-ja`)
2. Make your changes
3. Submit a Pull Request to the language repository

### Adding a new language

1. Create a new repository for the language (e.g., `nocobase-docs-xx`)
2. Use the existing language repos as a template
3. Add the submodule to the main repository:
   ```bash
   git submodule add https://github.com/YOUR_ORG/nocobase-docs-xx docs/docs/xx
   ```
4. Add the locale configuration to `rspress.config.ts`

## License

Same as the main NocoBase repository.
