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
#   ./scripts/gen_rag.sh all     # Generate both CN and EN files
#
# Output files will be generated in docs/docs/ directory

# Get the docs root directory (parent of scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$DOCS_ROOT/docs"

generate_rag() {
    local lang_dir="$DOCS_DIR/$1"
    local output_file="$DOCS_DIR/nocobase-docs-$1.txt"
    local lang_name=$2

    if [ ! -d "$lang_dir" ]; then
        echo "Error: Directory $lang_dir does not exist"
        return 1
    fi

    echo "Generating $lang_name documentation..."

    # Clear output file
    > "$output_file"

    # Traverse all md/mdx files sorted by directory structure
    find "$lang_dir" -type f \( -name "*.md" -o -name "*.mdx" \) | sort | while read -r file; do
        # Get relative path
        rel_path="${file#$lang_dir/}"

        # Write separator and file path
        echo "================================================================================" >> "$output_file"
        echo "FILE: $rel_path" >> "$output_file"
        echo "================================================================================" >> "$output_file"
        echo "" >> "$output_file"

        # Write file content
        cat "$file" >> "$output_file"

        # Add blank lines as separator
        echo "" >> "$output_file"
        echo "" >> "$output_file"
    done

    local file_count=$(grep -c '^FILE:' "$output_file")
    local file_size=$(du -h "$output_file" | cut -f1)

    echo "✓ $lang_name: docs/nocobase-docs-$1.txt"
    echo "  Files: $file_count"
    echo "  Size: $file_size"
    echo ""
}

echo "========================================"
echo "NocoBase Documentation RAG Generator"
echo "========================================"
echo ""

case "${1:-all}" in
    cn)
        generate_rag "cn" "Chinese"
        ;;
    en)
        generate_rag "en" "English"
        ;;
    all|"")
        generate_rag "cn" "Chinese"
        generate_rag "en" "English"
        ;;
    *)
        echo "Usage: $0 [cn|en|all]"
        exit 1
        ;;
esac

echo "Done!"
