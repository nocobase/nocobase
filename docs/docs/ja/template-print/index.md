---
pkg: "@nocobase/plugin-action-template-print"
---
:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::



# テンプレート印刷

## はじめに

テンプレート印刷**プラグイン**は、Word、Excel、PowerPoint（`.docx`、`.xlsx`、`.pptx` 形式に対応）でテンプレートファイルを編集し、テンプレート内にプレースホルダーやロジック構造を設定することで、`.docx`、`.xlsx`、`.pptx`、PDF ファイルといった所定の形式のファイルを動的に生成できます。見積書、請求書、契約書など、さまざまなビジネス文書の生成に幅広く活用いただけます。

### 主な機能

-   **複数形式に対応**: Word、Excel、PowerPoint のテンプレートに対応しており、さまざまなドキュメント生成ニーズに応えます。
-   **動的なデータ入力**: プレースホルダーとロジック構造を通じて、ドキュメントの内容を自動的に入力・生成します。
-   **柔軟なテンプレート管理**: テンプレートの追加、編集、削除、分類管理に対応しており、メンテナンスや利用が簡単です。
-   **豊富なテンプレート構文**: 基本的な置換、配列アクセス、ループ、条件付き出力など、多様なテンプレート構文をサポートしており、複雑なドキュメント生成ニーズに対応します。
-   **フォーマッター対応**: 条件付き出力、日付の書式設定、数値の書式設定などの機能を提供し、ドキュメントの可読性と専門性を向上させます。
-   **効率的な出力形式**: PDF ファイルの直接生成に対応しており、共有や印刷に便利です。

## インストール

### プラグインのインストール

[商用プラグインのインストールとアップグレード](https://www.nocobase.com/c/blog/nocobase-commercial-license-activation-guide) を参照してください。

### LibreOffice のインストール (オプション)

PDF を生成するには LibreOffice のインストールが必要です。[公式サイトからダウンロードしてください](https://www.libreoffice.org/download/download-libreoffice)。Docker 版の場合は、`./storage/scripts` ディレクトリに直接スクリプトを作成できます。

```bash
mkdir ./storage/scripts
cd ./storage/scripts
vim install-libreoffice.sh
```

`install-libreoffice.sh` の内容は以下の通りです。

```sh
#!/bin/bash

# Define variables
INSTALL_DIR="/opt/libreoffice24.8"
DOWNLOAD_URL="https://downloadarchive.documentfoundation.org/libreoffice/old/24.8.5.2/deb/x86_64/LibreOffice_24.8.5.2_Linux_x86-64_deb.tar.gz"

# Check if LibreOffice is already installed
if [ -d "$INSTALL_DIR" ]; then
    echo "LibreOffice is already installed, skipping installation."
    exit 0
fi

# Update APT sources
tee /etc/apt/sources.list > /dev/null <<EOF
deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm main contrib non-free
deb http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb-src http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free
deb http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
deb-src http://mirrors.aliyun.com/debian/ bookworm-backports main contrib non-free
EOF

# Update APT and install dependencies
apt-get update

apt-get install -y \
    libfreetype6 \
    fontconfig \
    libgssapi-krb5-2 \
    libxml2 \
    libnss3 \
    libdbus-1-3 \
    libcairo2 \
    libxslt1.1 \
    libglib2.0-0 \
    libcups2 \
    libx11-xcb1 \
    fonts-liberation \
    fonts-noto-cjk \
    wget

rm -rf /var/lib/apt/lists/*

cd /app/nocobase/storage/scripts

# Download and install LibreOffice if not already present
if [ ! -d "./libreoffice" ]; then
    rm -rf libreoffice.tar.gz
    wget --no-check-certificate -O libreoffice.tar.gz $DOWNLOAD_URL
    if [ $? -ne 0 ]; then
        echo "Failed to download LibreOffice."
        exit 1
    fi
    rm -rf libreoffice && mkdir libreoffice
    tar -zxvf libreoffice.tar.gz -C ./libreoffice --strip-components=1
    if [ $? -ne 0 ]; then
        echo "Failed to extract LibreOffice."
        exit 1
    fi
fi

# Install LibreOffice
dpkg -i libreoffice/DEBS/*.deb

ln -s /opt/libreoffice24.8/program/soffice.bin /usr/bin/libreoffice
libreoffice --version

if [ $? -ne 0 ]; then
    echo "Failed to install LibreOffice."
    exit 1
fi

echo "LibreOffice installation completed successfully."
```

`app` コンテナを再起動します。

```bash
docker compose restart app
# ログを確認
docker compose logs app
```

インストールが成功したか確認します。

```bash
$ docker compose exec app bash -c "libreoffice --version"

LibreOffice 24.8.4.2 bb3cfa12c7b1bf994ecc5649a80400d06cd71002
```