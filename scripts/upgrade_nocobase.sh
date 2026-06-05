#!/usr/bin/env bash
set -euo pipefail

log() {
  printf "\n[upgrade] %s\n" "$1"
}

run() {
  echo "+ $*"
  eval "$*"
}

# 前置检查
if ! command -v git >/dev/null 2>&1; then
  echo "git 未安装，请先安装 git"
  exit 1
fi
if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn 未安装，请先安装 yarn"
  exit 1
fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "当前目录不是 git 仓库，请在 NocoBase 项目根目录运行"
  exit 1
fi

# 2. 拉取最新代码
log "拉取最新代码"
run git pull

# 4. 更新依赖（设置国内镜像）
log "配置 yarn 国内镜像与禁用自更新检查"
run "yarn config set disable-self-update-check true"
run "yarn config set registry https://registry.npmmirror.com/"

log "安装依赖（可能需要较长时间）"
run yarn install

# 5. 执行更新命令（失败后自动清理并重试）
log "执行 NocoBase 升级"
set +e
yarn nocobase upgrade
UPGRADE_STATUS=$?
set -e

if [ "$UPGRADE_STATUS" -ne 0 ]; then
  log "升级失败，尝试清理缓存与依赖后重试"
  # 3. 删除缓存和旧依赖（可选，作为失败后的回退）
  run yarn nocobase clean
  run "yarn rimraf -rf node_modules"
  log "重新安装依赖"
  run yarn install
  log "再次执行升级"
  run yarn nocobase upgrade
fi

# 6. 启动 NocoBase（开发环境）
# log "启动开发环境：yarn dev"
# run yarn dev