#!/bin/bash
# 限制并发数的并行构建脚本

# 设置最大并发数（可根据 CPU 核心数调整）
MAX_JOBS=${MAX_JOBS:-4}

# 构建英文版本
echo "Building en (default)..."
yarn build

# 收集所有需要构建的语言
langs=()
for dir in ./docs/*; do
  if [ -d "$dir" ]; then
    lang=$(basename "$dir")
    if [ "$lang" != "en" ]; then
      langs+=("$lang")
    fi
  fi
done

total=${#langs[@]}
echo "Total languages to build: $total"
echo "Max concurrent jobs: $MAX_JOBS"

# 使用 xargs 控制并发数
printf "%s\n" "${langs[@]}" | xargs -P $MAX_JOBS -I {} bash -c '
  lang="{}"
  echo "[$(date +%H:%M:%S)] Building $lang..."
  if yarn build --lang=$lang; then
    echo "[$(date +%H:%M:%S)] ✓ $lang completed"
  else
    echo "[$(date +%H:%M:%S)] ✗ $lang failed"
    exit 1
  fi
'

if [ $? -eq 0 ]; then
  echo "All builds completed successfully!"
else
  echo "Some builds failed!"
  exit 1
fi

# dist 生成 tgz 压缩包
echo ""
echo "Creating dist archive..."

DIST_DIR="./dist"
if [ ! -d "$DIST_DIR" ]; then
  echo "Error: dist directory not found!"
  exit 1
fi

ARCHIVE_NAME="dist.tar.gz"

echo "Compressing dist to $ARCHIVE_NAME..."
tar -czf "$ARCHIVE_NAME" -C "$DIST_DIR" .

if [ $? -eq 0 ]; then
  # 获取文件大小
  if [[ "$OSTYPE" == "darwin"* ]]; then
    SIZE=$(stat -f%z "$ARCHIVE_NAME" | awk '{print int($1/1024/1024)}')
  else
    SIZE=$(stat -c%s "$ARCHIVE_NAME" | awk '{print int($1/1024/1024)}')
  fi
  
  echo ""
  echo "✓ Archive created successfully!"
  echo "  File: $ARCHIVE_NAME"
  echo "  Size: ${SIZE}MB"
  echo "  Location: $(pwd)/$ARCHIVE_NAME"
else
  echo "✗ Failed to create archive!"
  exit 1
fi
