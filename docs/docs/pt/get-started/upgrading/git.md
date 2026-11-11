# Atualizando uma Instalação NocoBase via Código-Fonte (Git)

:::warning Preparação Antes da Atualização

- Certifique-se de fazer um backup do seu banco de dados primeiro.
- Pare a instância do NocoBase que está em execução (`Ctrl + C`).
- Se a recuperação de senha por e-mail estiver ativada, confira o domínio de cada subaplicação e configure [APP_PUBLIC_ORIGIN](../installation/env.md#app_public_origin) para a aplicação principal e as subaplicações sem domínio próprio.

:::

## 1. Acesse o diretório do projeto NocoBase

```bash
cd my-nocobase-app
```

## 2. Puxe o código mais recente

```bash
git pull
```

## 3. Exclua o cache e dependências antigas (opcional)

Se o processo de atualização normal falhar, você pode tentar limpar o cache e as dependências e depois baixá-las novamente.

```bash
# Limpa o cache do NocoBase
yarn nocobase clean
# Exclui as dependências
yarn rimraf -rf node_modules # equivalente a rm -rf node_modules
```

## 4. Atualize as dependências

📢 Devido a fatores como ambiente de rede e configuração do sistema, esta próxima etapa pode levar mais de dez minutos.

```bash
yarn install
```

## 5. Execute o comando de atualização

```bash
yarn nocobase upgrade
```

## 6. Inicie o NocoBase

```bash
yarn dev
```

:::tip Dica para Ambiente de Produção

Não é recomendado implantar uma instalação do NocoBase a partir do código-fonte diretamente em um ambiente de produção (para ambientes de produção, consulte [Implantação em Produção](../deployment/production.md)).

:::

## 7. Atualização de plugins de terceiros

Consulte [Instalar e Atualizar Plugins](../install-upgrade-plugins.mdx)