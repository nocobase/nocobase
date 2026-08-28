---
title: "Armazenamento local"
description: "O mecanismo de armazenamento local salva os arquivos no disco rígido do servidor. É adequado para implantações em um único servidor, permitindo configurar o caminho de armazenamento e a URL de acesso."
keywords: "Armazenamento local,Local Storage,armazenamento de arquivos,disco rígido do servidor,NocoBase"
---

# Armazenamento local

Os arquivos enviados serão salvos em um diretório do disco rígido local do servidor, sendo adequado para cenários em que o volume total de arquivos enviados pelo sistema seja pequeno ou para fins experimentais.

## Parâmetros de configuração

![Exemplo de configuração do mecanismo de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Observação}
Aqui são apresentados apenas os parâmetros específicos do mecanismo de armazenamento local. Para consultar os parâmetros gerais, veja [Parâmetros gerais do mecanismo](./index.md#引擎通用参数).
:::

### Path

Representa simultaneamente o caminho relativo onde os arquivos são armazenados no servidor e o caminho de acesso por URL. Por exemplo: “`user/avatar`” (sem o “`/`” no início e no fim), que representa:

1. Path relativo onde os arquivos enviados são armazenados no servidor: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Prefixo do endereço URL para acesso: `http://localhost:13000/storage/uploads/user/avatar`.
