# Implantação em Ambiente de Produção

Ao implantar o NocoBase em um ambiente de produção, a instalação de dependências pode ser um pouco trabalhosa devido às diferenças nos métodos de construção entre os diversos sistemas e ambientes. Para ter uma experiência funcional completa, recomendamos a implantação com **Docker**. Se o seu ambiente não puder usar o Docker, você também pode implantar usando o **create-nocobase-app**.

:::warning Atenção

Não é recomendado implantar diretamente do código-fonte em um ambiente de produção. O código-fonte possui muitas dependências, é grande em tamanho e uma compilação completa exige bastante CPU e memória. Se você realmente precisar implantar a partir do código-fonte, sugerimos que primeiro construa uma imagem Docker personalizada e só então faça a implantação.

:::

:::warning Atenção

Ao implantar vários serviços NocoBase independentes, use um `hostname` diferente para cada serviço, como subdomínios distintos. Não diferencie os serviços apenas pela porta, como `https://example.com:13000` e `https://example.com:14000`.

O NocoBase usa cookies para manter o estado de login e as [permissões de acesso a arquivos](../../file-manager/stable-url.md). Os navegadores não isolam cookies por porta, portanto serviços em portas diferentes sob o mesmo `hostname` podem compartilhar cookies com o mesmo nome. Isso pode sobrescrever o estado de login ou causar falhas de autorização na pré-visualização e no download de arquivos.

Os subaplicativos na mesma implantação do NocoBase não estão sujeitos a essa restrição. Os cookies de login são diferenciados pelo nome do aplicativo, portanto o aplicativo principal e subaplicativos com nomes diferentes podem compartilhar o mesmo `hostname`.

No entanto, serviços independentes ainda precisam ser isolados. Se outro serviço NocoBase for executado em outra porta sob o mesmo `hostname` e contiver um aplicativo principal ou subaplicativo com o mesmo nome, os cookies ainda poderão entrar em conflito.

Use endereços como `app1.example.com` e `app2.example.com` e encaminhe-os para serviços NocoBase diferentes por meio do Nginx ou Caddy.

:::

## Frontend separado / Acesso a API entre origens

Prefira manter as páginas e a API na mesma origem: use um proxy reverso no mesmo domínio para encaminhar `${APP_PUBLIC_PATH}api/` e `${APP_PUBLIC_PATH}files/` para o serviço NocoBase e deixe `API_BASE_URL` vazio.

Se as páginas precisarem acessar a API entre origens (`API_BASE_URL` apontando para outra origem), adicione a origem da página a `CORS_ORIGIN_WHITELIST`. Caso contrário, o navegador ignorará `Set-Cookie` nas respostas da API, o cookie de login não será armazenado e a visualização e o download por URLs estáveis de arquivo falharão na autorização.

Observe também que os cookies são armazenados por `hostname`: quando as páginas e a API usam domínios totalmente diferentes, as requisições para `/files/` a partir do domínio da página não enviarão o cookie de login armazenado no domínio da API. Implantações assim devem ser alteradas para um proxy reverso de mesma origem. Consulte [Variáveis de ambiente](../installation/env.md#api_base_url).

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
