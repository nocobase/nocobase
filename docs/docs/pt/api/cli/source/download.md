---
title: "nb source download"
description: "Referência do comando nb source download: obtém o código-fonte ou imagem do NocoBase a partir do npm, Docker ou Git."
keywords: "nb source download,NocoBase CLI,download,npm,Docker,Git"
---

# nb source download

Obtém o NocoBase a partir do npm, Docker ou Git. `--version` é o parâmetro de versão compartilhado entre as três origens: para npm é a versão do pacote, para Docker é a tag da imagem e para Git é a git ref.

## Uso

```bash
nb source download [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Usa os valores padrão e pula os prompts interativos |
| `--verbose` | boolean | Exibe a saída detalhada do comando |
| `--locale` | string | Idioma dos prompts do CLI: `en-US` ou `zh-CN` |
| `--source`, `-s` | string | Origem: `docker`, `npm` ou `git` |
| `--version`, `-v` | string | Versão do pacote npm, tag da imagem Docker ou git ref |
| `--replace`, `-r` | boolean | Substitui o diretório de destino quando ele já existir |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Define se devDependencies serão instaladas durante a instalação npm/Git |
| `--output-dir`, `-o` | string | Diretório de destino do download, ou diretório onde o tarball Docker será salvo |
| `--git-url` | string | URL do repositório Git |
| `--docker-registry` | string | Nome do repositório de imagens Docker, sem a tag |
| `--docker-platform` | string | Plataforma da imagem Docker: `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Define se a imagem Docker será salva como tarball após o pull |
| `--npm-registry` | string | Registry usado para download e instalação de dependências npm/Git |
| `--build` / `--no-build` | boolean | Define se o build será executado após a instalação de dependências npm/Git |
| `--build-dts` | boolean | Define se arquivos de declaração TypeScript serão gerados durante o build npm/Git |

## Exemplos

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
```

## Aliases de versão

Na origem Git, dist-tags comuns são resolvidos para os respectivos branches: `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Comandos relacionados

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
