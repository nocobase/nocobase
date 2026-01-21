:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Implantação em Ambiente de Produção

Ao implantar o NocoBase em um ambiente de produção, a instalação de dependências pode ser um pouco trabalhosa devido às diferenças nos métodos de construção entre os diversos sistemas e ambientes. Para ter uma experiência funcional completa, recomendamos a implantação com **Docker**. Se o seu ambiente não puder usar o Docker, você também pode implantar usando o **create-nocobase-app**.

:::warning

Não é recomendado implantar diretamente do código-fonte em um ambiente de produção. O código-fonte possui muitas dependências, é grande em tamanho e uma compilação completa exige bastante CPU e memória. Se você realmente precisar implantar a partir do código-fonte, sugerimos que primeiro construa uma imagem Docker personalizada e só então faça a implantação.

:::

## Processo de Implantação

Para a implantação em ambiente de produção, você pode consultar os passos de instalação e atualização já existentes.

### Nova Instalação

- [Instalação com Docker](../installation/docker.mdx)
- [Instalação com create-nocobase-app](../installation/create-nocobase-app.mdx)

### Atualizando o Aplicativo

- [Atualização de uma Instalação Docker](../installation/docker.mdx)
- [Atualização de uma Instalação create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalação e Atualização de Plugins de Terceiros

- [Instalando e Atualizando Plugins](../install-upgrade-plugins.mdx)

## Proxy de Recursos Estáticos

Em um ambiente de produção, é recomendado gerenciar os recursos estáticos com um servidor proxy, por exemplo:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Comandos Comuns de Operação

Dependendo do método de instalação, você pode usar os seguintes comandos para gerenciar o processo do NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)