#!/bin/bash
#
# NocoBase Documentation RAG Generator
#
# Usage: ./scripts/gen_rag.sh [cn|en|all]
#
# Examples:
#   ./scripts/gen_rag.sh         # Generate both CN and EN files
#   ./scripts/gen_rag.sh cn      # Generate CN only
#   ./scripts/gen_rag.sh en      # Generate EN only
#
# Prerequisites:
#   - Run `yarn build` first to generate search_index files
#
# Output files will be generated in docs/docs/ directory

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$DOCS_ROOT/docs"
DIST_DIR="$DOCS_ROOT/dist/static"

# Domain mapping
CN_DOMAIN="https://v2.docs.nocobase.com/cn"
EN_DOMAIN="https://v2.docs.nocobase.com"

generate_rag() {
    local lang=$1
    local domain=$2
    local output_file="$DOCS_DIR/nocobase-docs-$lang.txt"

    # Find search_index file
    local index_file=$(ls "$DIST_DIR"/search_index.$lang.*.json 2>/dev/null | head -1)

    if [ ! -f "$index_file" ]; then
        echo "Error: search_index.$lang.*.json not found in $DIST_DIR"
        echo "Please run 'yarn build' first"
        return 1
    fi

    echo "Generating $lang documentation from $index_file..."

    python3 << PYTHON
import json
import os

with open("$index_file", 'r', encoding='utf-8') as f:
    data = json.load(f)

docs_dir = "$DOCS_DIR"
domain = "$domain"
output_file = "$output_file"
lang = "$lang"

with open(output_file, 'w', encoding='utf-8') as out:
    count = 0
    for entry in sorted(data, key=lambda x: x.get('routePath', '')):
        route_path = entry.get('routePath', '')
        title = entry.get('title', '')

        # Build URL
        # routePath is like /cn/ai-employees/... for cn, /en/ai-employees/... for en
        # We need to strip the lang prefix since domain already includes it
        if route_path.startswith(f'/{lang}/'):
            url_path = route_path[len(f'/{lang}'):]
        elif route_path.startswith(f'/{lang}'):
            url_path = route_path[len(f'/{lang}'):]
        else:
            url_path = route_path

        url = domain + url_path

        # Find corresponding file
        # CN: routePath = /cn/xxx, file = cn/xxx.md
        # EN: routePath = /xxx (no /en prefix), file = en/xxx.md
        if route_path.startswith(f'/{lang}/'):
            file_base = route_path
        else:
            file_base = f'/{lang}{route_path}'

        possible_files = [
            f"{docs_dir}{file_base}.md",
            f"{docs_dir}{file_base}.mdx",
            f"{docs_dir}{file_base}/index.md",
            f"{docs_dir}{file_base}/index.mdx"
        ]

        file_path = None
        for p in possible_files:
            if os.path.exists(p):
                file_path = p
                break

        if not file_path:
            continue

        # Read file content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Get relative file path
        rel_path = file_path.replace(docs_dir + '/', '')

        # Write entry
        out.write("=" * 80 + "\\n")
        out.write(f"URL: {url}\\n")
        out.write(f"FILE: {rel_path}\\n")
        out.write("=" * 80 + "\\n\\n")
        out.write(content)
        out.write("\\n\\n")

        count += 1

print(f"Generated {count} entries")
PYTHON

    local file_count=$(grep -c '^URL:' "$output_file")
    local file_size=$(du -h "$output_file" | cut -f1)

    echo "✓ $lang: docs/nocobase-docs-$lang.txt"
    echo "  Entries: $file_count"
    echo "  Size: $file_size"
    echo ""
}

echo "========================================"
echo "NocoBase Documentation RAG Generator"
echo "========================================"
echo ""

case "${1:-all}" in
    cn)
        generate_rag "cn" "$CN_DOMAIN"
        ;;
    en)
        generate_rag "en" "$EN_DOMAIN"
        ;;
    all|"")
        generate_rag "cn" "$CN_DOMAIN"
        generate_rag "en" "$EN_DOMAIN"
        ;;
    *)
        echo "Usage: $0 [cn|en|all]"
        exit 1
        ;;
esac

echo "Done!"
