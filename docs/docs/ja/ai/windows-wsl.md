---
title: Windows で WSL を使ってローカル開発環境をセットアップする
description: Windows 上の WSL 2 で Ubuntu、Docker Desktop、Node.js、Yarn、Codex CLI を準備し、NocoBase のローカル開発と AI Agent の作業に使えるようにします。
---

# Windows で WSL を使ってローカル開発環境をセットアップする

Windows で NocoBase をローカル開発する場合、まず WSL 2 を準備することをおすすめします。Node.js、Yarn、NocoBase CLI、Docker コマンド、AI Agent を同じ Linux shell で実行でき、パス、権限、ネイティブ依存関係のビルドも一般的な Linux デプロイ環境に近くなります。

WSL が必要かまだ分からない場合は、先に [ローカル開発環境のセットアップ](./local-development-setup.md) を確認してください。

## 準備

始める前に、Windows のバージョンと仮想化の状態を確認します。

### Windows バージョンを確認する

`Win + R` を押して `winver` を入力し、次のいずれかを満たしていることを確認します。

- Windows 11
- Windows 10 version 2004 以降、Build 19041 以降

古いバージョンの場合は、先に Windows を更新してください。

### 仮想化を確認する

タスクマネージャーを開き、パフォーマンス / CPU で仮想化が有効になっていることを確認します。

有効でない場合は、BIOS / UEFI で有効にします。名称は Intel VT-x、Intel Virtualization Technology、AMD-V、SVM Mode など、メーカーによって異なります。

## ステップ 1: WSL 2 をインストールする

PowerShell を管理者として開き、実行します。

```powershell
wsl --install
```

インストール後、コンピューターを再起動します。デフォルトでは Ubuntu がインストールされます。初回起動時に Linux ユーザー名とパスワードの作成を求められます。これは WSL 内だけで使う情報です。

特定のディストリビューションを選ぶ場合は、まず一覧を確認します。

```powershell
wsl --list --online
```

たとえば Ubuntu をインストールします。

```powershell
wsl --install -d Ubuntu
```

## ステップ 2: WSL バージョンを確認する

PowerShell で実行します。

```powershell
wsl --list --verbose
```

使用するディストリビューションの `VERSION` が `2` であることを確認します。

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

WSL 1 の場合は WSL 2 に変換し、既定値も WSL 2 にします。

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## ステップ 3: Docker Desktop をインストールする

Docker で NocoBase をインストールまたは実行する場合は、Docker Desktop for Windows をインストールします。

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

ローカル開発では通常 `Per-user` で十分です。設定画面では `Use WSL 2 instead of Hyper-V` を選び、インストール後に Windows のスタートメニューから Docker Desktop を起動します。

## ステップ 4: Docker の WSL 統合を有効にする

Docker Desktop で WSL 2 backend を有効にします。

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

次に、WSL ディストリビューションとの統合を有効にします。

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. `Ubuntu` など使用するディストリビューションを有効化
4. Apply & restart または Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

WSL Integration が表示されない場合、Docker Desktop が Windows containers モードになっていることがあります。Windows の通知領域にある Docker アイコンから Linux containers に切り替えて、再度確認してください。

## ステップ 5: Docker を確認する

PowerShell で確認します。

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

WSL に入ります。

```powershell
wsl
```

WSL 内でも確認します。

```bash
docker version
docker compose version
docker run hello-world
```

`hello-world` コンテナを取得して実行できれば、Docker Desktop と WSL 2 の統合は動作しています。

## ステップ 6: WSL に Node.js と Yarn をインストールする

WSL はデフォルトで Node.js 実行環境ではありません。`wsl --install` で入る Ubuntu には、通常 Node.js と npm は含まれていません。

WSL 内でまず確認します。

```bash
node -v
npm -v
```

見つからない場合は、NodeSource で Node.js 22 をインストールします。

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
npx -v
```

プロジェクトごとに Node.js のバージョンを切り替える場合は、nvm を使います。

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
npm -v
npx -v
```

:::warning 注意

NodeSource と nvm はどちらか一方を選んでください。同じ WSL ユーザー環境で両方を混在させることはおすすめしません。

:::

Yarn 1.x をインストールします。

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Corepack が使えない場合は npm でインストールします。

```bash
npm install -g yarn@1.22.22
yarn -v
```

## ステップ 7: Codex CLI をインストールする

Codex CLI は Windows ネイティブのコマンドラインでも利用できます。このガイドでは、Codex と NocoBase のローカルツールチェーンを同じ Linux 環境に置くため、WSL 内にインストールします。

WSL 内にいることを確認します。

```bash
echo $WSL_DISTRO_NAME
```

WSL 内で Codex CLI をインストールします。

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

非対話インストールの場合はこちらです。

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Codex を起動して確認します。

```bash
codex
codex --version
```

WSL 内のプロジェクトディレクトリから Codex を起動することをおすすめします。

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip 補足

Codex は WSL 内にインストールされているため、その後も WSL ターミナルから `codex` を実行してください。PowerShell は Windows ネイティブ環境であり、このガイドで準備した WSL 環境とは別です。

:::

## プロジェクトファイルの置き場所

プロジェクトは WSL ファイルシステム内に置くことをおすすめします。

```bash
~/projects/my-app
```

Windows のマウントパスを標準の置き場所にするのは避けます。

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

通常、ファイルシステム性能が良くなり、権限やシンボリックリンクの問題も減らせます。

Windows Explorer から WSL ファイルにアクセスする場合はこちらです。

```text
\\wsl$\Ubuntu\home\<your-name>
```

## よくある質問

### WSL で docker コマンドが見つからない

ディストリビューションが WSL 2 であることを確認し、Docker Desktop / Settings / Resources / WSL Integration で対象ディストリビューションの統合を有効にします。

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### WSL Integration が表示されない

Docker Desktop が Windows containers モードになっている可能性があります。Docker アイコンから Linux containers に切り替え、WSL Integration を再確認してください。

### Docker Desktop が起動しない、または WSL の状態がおかしい

まず次を試してください。

```powershell
wsl --shutdown
wsl --update
```

その後 Docker Desktop を再起動します。

### WSL に Docker Engine を手動インストール済みの場合

Docker Desktop を使う前に、WSL ディストリビューションへ直接インストールした Docker Engine や Docker CLI を削除することが推奨されています。WSL 統合との競合を避けるためです。

### WSL で codex コマンドが見つからない

WSL 内で実行していることを確認し、`PATH` を確認します。

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## 公式参考資料

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
