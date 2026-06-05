:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Atualizando uma Instalação Docker

:::warning Antes de atualizar

- Certifique-se de fazer backup do seu banco de dados.

:::

## 1. Acesse o diretório onde o docker-compose.yml está localizado

Por exemplo

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Atualize o número da versão da imagem

:::tip Sobre os Números de Versão

- Versões de alias, como `latest`, `latest-full`, `beta`, `beta-full`, `alpha`, `alpha-full`, geralmente não precisam ser alteradas.
- Números de versão numéricos, como `1.7.14`, `1.7.14-full`, precisam ser alterados para o número da versão desejada.
- Apenas atualizações são suportadas; *downgrades* não são!!!
- Em ambientes de produção, é recomendado fixar uma versão numérica específica para evitar atualizações automáticas não intencionais. [Ver todas as versões](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Recomendado usar a imagem do Alibaba Cloud (pode oferecer melhor desempenho de rede)
    image: nocobase/nocobase:1.7.14-full
    # Você também pode usar uma versão de alias (pode atualizar automaticamente, use com cautela em produção)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
    # Docker Hub (pode ser mais lento/falhar)
    # image: nocobase/nocobase:1.7.14-full
# ...
```

## 3. Reinicie o contêiner

```bash
# Puxe a imagem mais recente
docker compose pull app

# Recrie o contêiner
docker compose up -d app

# Verifique o status do processo do app
docker compose logs -f app
```

## 4. Atualizando plugins de terceiros

Consulte [Instalar e Atualizar Plugins](../install-upgrade-plugins.mdx)

## 5. Instruções para Reversão (Rollback)

O NocoBase não suporta *downgrades*. Se precisar reverter, restaure o backup do banco de dados feito antes da atualização e altere a versão da imagem de volta para a versão original.

## 6. Perguntas Frequentes (FAQ)

**P: Imagem sendo puxada lentamente ou falha**

Use um acelerador de imagem ou utilize a imagem do Alibaba Cloud `nocobase/nocobase:<tag>`.

**P: A versão não mudou**

Confirme se você alterou `image` para o novo número de versão e executou com sucesso `docker compose pull app` e `up -d app`.

**P: Falha ao baixar ou atualizar plugin comercial**

Para plugins comerciais, por favor, verifique a chave de licença no sistema e, em seguida, reinicie o contêiner Docker. Para mais detalhes, consulte o [Guia de Ativação de Licença Comercial do NocoBase](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide).