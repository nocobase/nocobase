#Nginx

Se você usou o Nginx para gerenciar o site no servidor ou precisa lidar com certificados, caches e controle de acesso posteriormente, `nb proxy nginx` é o caminho padrão recomendado.

Se você deseja apenas configurar o HTTPS o mais rápido possível e não deseja manter muitos detalhes do proxy, então [Caddy](./caddy.md) ficará mais tranquilo. Mas contanto que você esteja usando o Nginx, este documento será o caminho padrão.

## Quando é mais adequado usar o Nginx?

De modo geral, as seguintes situações dão prioridade à continuação do uso do Nginx:

- Você usou o Nginx para gerenciar vários sites no servidor.
- Você mesmo precisará manter certificados, caches, controles de acesso ou mais regras personalizadas posteriormente
- Você deseja que a camada de entrada continue a usar o método existente de operação e manutenção do Nginx

Se o seu objetivo é apenas passar o HTTPS o mais rápido possível e você não deseja manter muitos detalhes do TLS, então [Caddy](./caddy.md) ficará mais livre de preocupações.

## Primeiro siga estes três comandos.

Se você deseja apenas executar primeiro a camada de entrada Nginx, basta lembrar estes três comandos por padrão:

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Se o Nginx tiver sido instalado localmente, basta alterar a primeira entrada para `nb proxy nginx use local`.

Na maioria dos cenários, é suficiente executar `use` primeiro, depois `generate` e finalmente `reload`. Para obter outros detalhes e mais comandos, consulte os capítulos a seguir ou a referência da CLI.

## Etapa 1: primeiro selecione como executar o Nginx você mesmo

Se o Nginx já estiver instalado na máquina atual, basta usar `use local`.

Se você quiser usar a versão Docker do Nginx, use `use docker`.

O `local` / `docker` aqui se refere ao modo de execução do próprio **Nginx**.

Usando a versão Docker do Nginx:

```bash
nb proxy nginx use docker
```

Usando um Nginx instalado localmente:

```bash
nb proxy nginx use local
```

Se você esquecer qual método está selecionado no momento, poderá executar:

```bash
nb proxy nginx current
```

## Etapa 2: Execute `generate`

`generate` é usado para gerar a configuração de entrada Nginx de acordo com o ambiente especificado. A maneira mais comum de escrever é:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Se você também quiser especificar a porta de entrada, também poderá escrevê-la junto:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com --port 8080
```

O significado dos parâmetros aqui é:

- `--env`: Especifique para qual ambiente CLI gerar configuração
- `--host`: Especifique o nome de domínio para acesso externo
- `--port`: Especifica a porta de entrada do proxy, não a `appPort` da própria aplicação NocoBase

A porta upstream do aplicativo vem do `appPort` salvo deste ambiente. Se o comando solicitar que env está faltando `appPort`, execute:

```bash
nb env update test2 --app-port 56575
```

Se posteriormente você alterar configurações como `app-port` e `app-public-path` que afetarão os resultados do proxy, lembre-se de executar novamente `generate`.

## Etapa 3: Execute `reload`

Após gerar a configuração, execute diretamente:

```bash
nb proxy nginx reload
```

Na maioria dos cenários, basta usar este comando diretamente. Se ainda não estiver em execução, a inicialização será processada primeiro internamente; se já estiver em execução, será recarregado de acordo com a configuração mais recente.

## Quais arquivos a CLI manterá?

Tomando `test2` como exemplo, os comandos relacionados ao Nginx geralmente mantêm estes arquivos e diretórios:

| caminho | função |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets` | Diretório de trechos compartilhados Nginx |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf` | Configuração de entrada de site editável |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html` | página alternativa do SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html` | página alternativa do SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Diretório de produtos de construção de front-end usado atualmente |
| `NB_CLI_ROOT/test2/storage/uploads` | O diretório de upload do aplicativo atual |

em:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` A seguir estão os arquivos auxiliares do agente mantidos pela CLI
- `NB_CLI_ROOT/test2/storage/...` A seguir estão os recursos estáticos e diretórios de upload do próprio aplicativo
- `app.conf` pode ser alterado, mas o bloco gerenciado NocoBase deve ser mantido
- `index-v1.html` e `index-v2.html` reescreverão automaticamente os endereços de recursos de acordo com o subcaminho do ambiente atual, a versão do cliente ativo e `CDN_BASE_URL`

:::nota de aviso

Se você deseja adicionar configuração Nginx em nível de site, como limitação de corrente, cabeçalhos adicionais e controle de acesso, basta alterar `app.conf`. Os arquivos auxiliares gerenciados pela CLI são atualizados de forma síncrona nas reconstruções subsequentes.

:::

## Configuração manuscrita: o que fazer sem CLI

Se o seu aplicativo não estiver hospedado na CLI ou se você desejar explicitamente manter a configuração completa do Nginx, também poderá escrevê-lo manualmente.

No entanto, para o NocoBase, o proxy reverso de produção geralmente é mais do que um simples `proxy_pass`. Além de encaminhar solicitações de API para o aplicativo de back-end, uma configuração completa também precisa tratar o diretório de upload, recursos estáticos de front-end, a rota de acesso a arquivos `/files/`, WebSocket, a rota `.well-known` e as páginas de fallback da SPA.

Tomando `test2` como exemplo, os principais arquivos e diretórios relacionados ao Nginx geralmente incluem:

- Trechos Nginx: `NB_CLI_ROOT/.nocobase/proxy/nginx/snippets`
- Configuração de entrada editável: `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/app.conf`
- Página substituta do SPA (v1): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v1.html`
- Página substituta do SPA (v2): `NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/index-v2.html`
- Diretório de produtos de criação de front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Diretório de upload: `NB_CLI_ROOT/test2/storage/uploads`

Em outras palavras, a configuração manuscrita geralmente precisa cobrir pelo menos os seguintes tipos de entradas:

- `uploads`: exponha o diretório de upload por meio de `alias`
- `dist`: exponha o diretório do produto de compilação front-end por meio de `alias`
- `well-known`: Lidar com caminhos de descoberta relacionados a OAuth/OpenID
- `files`: encaminhar solicitações de acesso a arquivos sob `/files/` para o aplicativo de back-end
- `api`: encaminha a solicitação `/api/` para o aplicativo back-end
- `ws`: encaminha solicitações WebSocket para o aplicativo backend
- `spa`: fornece entrada de front-end e substituto `try_files` para `/` e `/v/`

Portanto, uma configuração completa do Nginx geralmente não é apenas o seguinte método geral de gravação de proxy reverso:

```nginx
location / {
    proxy_pass http://127.0.0.1:13000;
}
```

Para um aplicativo hospedado em CLI como `test2`, uma estrutura mais próxima de uma implantação real normalmente seria assim:

```nginx
server {
    listen 80;
    server_name c.local.nocobase.com;

    # Add custom directives or locations above the managed block as needed.

    client_max_body_size 0;

    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/mime-types.conf;
    include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/gzip.conf;

    location /storage/uploads/ {
        alias NB_CLI_ROOT/test2/storage/uploads/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/uploads-location.conf;
    }

    location ^~ /dist/ {
        alias NB_CLI_ROOT/test2/storage/dist-client/;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/dist-location.conf;
    }

    location ~ ^/\\.well-known/(?<well_known>oauth-authorization-server|openid-configuration)/(?<resource_path>.+)$ {
        rewrite ^ /$resource_path/.well-known/$well_known break;
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /files/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /ws {
        proxy_pass http://127.0.0.1:56575;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/proxy-location.conf;
    }

    location = /v {
        return 302 /v/$is_args$args;
    }

    location ^~ /v/ {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v2.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    location ^~ / {
        alias NB_CLI_ROOT/.nocobase/proxy/nginx/test2/public/;
        try_files $uri /index-v1.html =404;
        include NB_CLI_ROOT/.nocobase/proxy/nginx/snippets/spa-location.conf;
    }

    # Add custom directives or locations below the managed block as needed.
}
```

Existem dois pontos principais aqui:

- `NB_CLI_ROOT/.nocobase/proxy/nginx/...` A seguir estão os arquivos auxiliares do agente mantidos pela CLI
- `NB_CLI_ROOT/test2/storage/...` O seguinte é usar seu próprio diretório de produtos e diretório de upload

Se o seu aplicativo usar implantação de subcaminho ou se os recursos front-end, o diretório de upload e o proxy reverso não estiverem na mesma perspectiva de caminho, a configuração manuscrita estará mais sujeita a erros. Neste cenário, normalmente é mais recomendado executar:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Em seguida, faça ajustes com base nos resultados gerados.

Uma abordagem mais prudente é geralmente:

1. Primeiro deixe a CLI gerar a configuração Nginx
2. Confirme a estrutura de roteamento e o caminho real com base nos resultados gerados.
3. Em seguida, faça ajustes manuais de acordo com seu nome de domínio, modo de execução e caminho de montagem.

Geralmente, é menos provável que você deixe de tratar detalhes relacionados a `/files/`, WebSockets, recursos estáticos, diretórios de upload ou páginas de fallback da SPA do que ao escrever uma configuração do zero.

:::warning Atenção

`/files/` é uma rota da aplicação que precisa passar pela autorização do NocoBase. Não a trate como um diretório estático nem permita que ela caia no fallback da SPA. Encaminhe-a para o back-end do NocoBase e coloque a regra antes de `location /` e das demais regras de fallback do front-end.

Se `APP_PUBLIC_PATH=/nocobase/` estiver configurado, encaminhe também `/nocobase/files/`. Mantenha a regra `/files/` na raiz para compatibilidade com URLs de arquivos existentes.

:::

## Como lidar com HTTPS

Se você decidiu continuar usando o Nginx, o HTTPS também pode continuar a ser configurado no Nginx. Uma prática comum é expandir a entrada dupla `listen 80` para `80/443` e, em seguida, adicionar o caminho do certificado e a configuração TLS.

No entanto, se você deseja apenas disponibilizar o HTTPS o mais rápido possível e não deseja lidar com a solicitação e renovação do certificado sozinho, será mais tranquilo usar o [Caddy](./caddy.md) diretamente.

## Instruções comuns

- `nb proxy nginx generate` é para aplicativos instalados por `nb init`
- Se você alterar posteriormente configurações como `app-port` e `app-public-path` que afetarão os resultados do proxy, lembre-se de executar novamente `generate`

## Links relacionados

- [Proxy reverso do ambiente de produção](./index.md)
- [Caddy](./caddy.md)
- [Instalar usando CLI (recomendado)](../../installation/cli.md)
- [Configuração do aplicativo com `.env`](../../installation/env.md)
- [`nb proxy nginx` Referência de comando](../../../api/cli/proxy/nginx/index.md)
