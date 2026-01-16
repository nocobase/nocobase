#!/bin/bash

# Languages to process (excluding en, cn, vi which are already done)
LANGS="ar cs de es fr he hi id it ja ko nl pl pt ru sv th tr uk"

MAIN_REPO="/home/albert/prj/nocobase"
DOCS_DIR="$MAIN_REPO/docs/docs"

for lang in $LANGS; do
  echo "======================================"
  echo "Processing: $lang"
  echo "======================================"

  REPO_NAME="nocobase-docs-$lang"
  REPO_DIR="/home/albert/prj/$REPO_NAME"

  # 1. Create local repo directory
  if [ -d "$REPO_DIR" ]; then
    echo "Directory exists, cleaning..."
    rm -rf "$REPO_DIR"
  fi
  mkdir -p "$REPO_DIR"

  # 2. Copy docs content (flat structure for submodule)
  echo "Copying docs content..."
  cp -r "$DOCS_DIR/$lang"/* "$REPO_DIR/"

  # 3. Copy logos
  cp "$DOCS_DIR/public/logo.png" "$REPO_DIR/" 2>/dev/null
  cp "$DOCS_DIR/public/logo-white.png" "$REPO_DIR/" 2>/dev/null

  # 4. Create package.json
  cat > "$REPO_DIR/package.json" << EOF
{
  "name": "@nocobase/docs-$lang",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "rspress build",
    "dev": "rspress dev",
    "preview": "rspress preview"
  },
  "dependencies": {
    "@rspress/core": "^2.0.0-beta.34"
  },
  "devDependencies": {
    "@rsbuild/plugin-sass": "^1.4.0",
    "@rspress/plugin-sitemap": "^2.0.0-beta.34"
  }
}
EOF

  # 5. Create rspress.config.ts
  cat > "$REPO_DIR/rspress.config.ts" << EOF
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const base = process.env.DOCS_BASE || '/$lang/';

export default defineConfig({
  root: __dirname,
  outDir: 'dist',
  base,
  title: 'NocoBase Documentation',
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: '/logo.png',
    dark: '/logo-white.png',
  },
  route: { cleanUrls: true },
  builderConfig: { plugins: [pluginSass()] },
  plugins: [pluginSitemap({ siteUrl: 'https://docs.nocobase.com' })],
  lang: '$lang',
  locales: [{ lang: '$lang', label: '$lang', title: 'NocoBase Documentation', description: 'NocoBase Documentation' }],
  themeConfig: {
    socialLinks: [{ icon: 'github', mode: 'link', content: 'https://github.com/nocobase/nocobase' }],
  },
});
EOF

  # 6. Create README
  cat > "$REPO_DIR/README.md" << EOF
# NocoBase Documentation - $lang

This repository contains the $lang translation of NocoBase documentation.

## Development

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Contributing

1. Fork this repository
2. Make your changes
3. Submit a Pull Request

## License

Same as the main NocoBase repository.
EOF

  # 7. Initialize git and commit
  echo "Initializing git..."
  cd "$REPO_DIR"
  git init -q
  git add -A
  git commit -q -m "Initial commit: $lang documentation"

  # 8. Create GitHub repo and push
  echo "Creating GitHub repo..."
  gh repo create "Albert-mah/$REPO_NAME" --public --description "NocoBase Documentation - $lang" -y 2>/dev/null || true

  echo "Pushing to GitHub..."
  git remote add origin "git@github.com:Albert-mah/$REPO_NAME.git" 2>/dev/null || git remote set-url origin "git@github.com:Albert-mah/$REPO_NAME.git"
  git push -u origin main -f

  # 9. Remove from main repo and add as submodule
  echo "Setting up submodule..."
  cd "$MAIN_REPO"
  rm -rf "$DOCS_DIR/$lang"
  git add "$DOCS_DIR/$lang"

  # Add submodule
  git submodule add "https://github.com/Albert-mah/$REPO_NAME.git" "docs/docs/$lang" 2>/dev/null || true

  echo "Done: $lang"
  echo ""
done

echo "======================================"
echo "All languages processed!"
echo "======================================"
