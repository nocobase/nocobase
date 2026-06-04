---
title: "nb plugin import"
description: "Referência do comando nb plugin import: importa um arquivo de plugin empacotado ou um pacote npm para o diretório storage/plugins do env NocoBase selecionado, ou para um caminho de storage personalizado."
keywords: "nb plugin import,NocoBase CLI,importar plugin,storage-path,npm-registry"
---

# nb plugin import

Importa um arquivo de plugin empacotado ou um pacote npm para `storage/plugins`. Esse comando apenas coloca o plugin no diretório de destino. Ele não ativa o plugin automaticamente.

## Uso

```bash
nb plugin import <archive> [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `<archive>` | string | Origem do plugin. Obrigatório. Aceita um caminho local `.tgz`, uma URL remota de arquivo `http(s)` ou um nome / tag de pacote npm |
| `--env`, `-e` | string | Nome do env da CLI. Quando omitido, normalmente usa o env atual. Se você passar `--storage-path` explicitamente, pode omitir `--env` |
| `--yes`, `-y` | boolean | Pula a confirmação interativa quando um `--env` passado explicitamente aponta para um env diferente do atual |
| `--storage-path` | string | Sobrescreve o caminho raiz do storage de destino. O diretório real de importação é `<storage-path>/plugins` |
| `--npm-registry` | string | Especifica qual registry npm usar quando a origem for um nome ou tag de pacote npm |

## Exemplos

```bash
# Arquivo remoto
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Arquivo local
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# Pacote npm ou tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Registry npm privado
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Gravar diretamente em um caminho local de storage sem depender do env atual
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Notas

Se você já selecionou o env de destino, normalmente basta importar direto para o `storage/plugins` desse env.

Se você só quer gravar o plugin em um diretório de storage local, passe `--storage-path`. Nesse caso, você pode omitir `--env`, e a CLI grava diretamente em `<storage-path>/plugins`.

Depois do import, o próximo passo normal é reiniciar a aplicação e então decidir se o plugin também precisa ser ativado. Na maioria dos casos:

- Em uma instalação pela primeira vez, execute [`nb app restart`](../app/restart.md) primeiro e depois [`nb plugin enable`](./enable.md)
- Se você apenas reimportou uma versão mais nova, reinicie a aplicação primeiro e depois verifique se a nova versão já foi carregada

Se a origem estiver em um registry npm privado, faça login primeiro e depois importe:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Observação

Você não precisa descompactar nada manualmente em `storage/plugins`. `nb plugin import` coloca o plugin automaticamente no diretório correto.

:::

## Comandos relacionados

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Instalar e atualizar plugins de terceiros`](../../../quickstart/plugins/third-party.md)
