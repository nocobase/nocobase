# 遍历 ./docs 目录下的所有子目录，并执行 yarn docs build --lang=子目录名
yarn build

for dir in ./docs/*; do
  if [ -d "$dir" ]; then
    lang=$(basename "$dir")
    # 排除 en 目录
    if [ "$lang" = "en" ]; then
      continue
    fi
    echo "Building $lang..."
    yarn build --lang=$lang
  fi
done
