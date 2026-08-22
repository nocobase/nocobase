#Caddy

Se você já possui um nome de domínio e deseja configurar o HTTPS o mais rápido possível, então `nb proxy caddy` geralmente é o método de entrada mais tranquilo.

Em vez de manter você mesmo a configuração do certificado do Nginx, o Caddy é mais como o atalho padrão para "executar primeiro a camada de entrada".

## Quando é mais apropriado usar o Caddy?

De modo geral, a Caddy tem prioridade nas seguintes situações:

- Você já possui um nome de domínio e deseja acessar HTTPS o mais rápido possível
- Você não deseja manter muitos certificados e detalhes de TLS por conta própria
- Tudo que você precisa é de uma camada de entrada simples e estável

Se você já usou o Nginx para gerenciar muitos sites no servidor ou precisa fazer cache mais pesado, controle de acesso e regras de personalização posteriormente, será mais fácil continuar olhando para [Nginx](./nginx.md).

## Primeiro siga estes três comandos.

Se você deseja apenas executar primeiro a camada de entrada do Caddy, basta lembrar estes três comandos por padrão:

```bash
nb proxy caddy use docker
nb proxy caddy generate --env test2 --host c.local.nocobase.com
nb proxy caddy reload
```

Se o Caddy tiver sido instalado localmente, basta alterar a primeira entrada para `nb proxy caddy use local`.

Na maioria dos cenários, é suficiente executar `use` primeiro, depois `generate` e finalmente `reload`. Para obter outros detalhes e mais comandos, consulte os capítulos a seguir ou a referência da CLI.

## Etapa 1: escolha como executar o Caddy você mesmo

Se o Caddy já estiver instalado na máquina atual, basta usar `use local`.

Se você quiser usar a versão Docker do Caddy, use `use docker`.

O `local` / `docker` aqui se refere à maneira como o **Caddy opera**.

Usando a versão Docker do Caddy:

```bash
nb proxy caddy use docker
```

Usando uma instalação local do Caddy:

```bash
nb proxy caddy use local
```

Se você esquecer qual método está selecionado no momento, poderá executar:

```bash
nb proxy caddy current
```

## Etapa 2: Execute `generate`

`generate` é usado para gerar a configuração do Caddy de acordo com o ambiente especificado. A maneira mais comum de escrever é:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Se você também quiser especificar a porta de entrada, também poderá escrevê-la junto:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com --port 8080
```

O significado dos parâmetros aqui é:

- `--env`: Especifique para qual ambiente CLI gerar configuração
- `--host`: Especifique o nome de domínio para acesso externo
- `--port`: Especifique a porta de entrada do proxy

Para Caddy, `--host` é especialmente importante. Em um ambiente formal, tente passar um nome de domínio que tenha sido resolvido para o servidor atual por padrão, para que o acesso HTTPS seja mais natural.

Se o comando solicitar que env está faltando `appPort`, execute primeiro:

```bash
nb env update test2 --app-port 56575
```

Se posteriormente você alterar configurações como `app-port` e `app-public-path` que afetarão os resultados do proxy, lembre-se de executar novamente `generate`.

## Etapa 3: Execute `reload`

Após gerar a configuração, execute diretamente:

```bash
nb proxy caddy reload
```

Na maioria dos cenários, basta usar este comando diretamente. Se ainda não estiver em execução, a inicialização será processada primeiro internamente; se já estiver em execução, será recarregado de acordo com a configuração mais recente.

## Quais arquivos a CLI manterá?

Tomando `test2` como exemplo, os comandos relacionados ao Caddy geralmente mantêm estes arquivos e diretórios:

| caminho | função |
| --- | --- |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy` | Configuração completa do site gerada pela CLI |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy` | Arquivo de entrada geral do Caddy, responsável por importar todos os env's `app.caddy` |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html` | página alternativa do SPA v1 |
| `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html` | página alternativa do SPA v2 |
| `NB_CLI_ROOT/test2/storage/dist-client` | Diretório de produtos de construção de front-end usado atualmente |
| `NB_CLI_ROOT/test2/storage/uploads` | O diretório de upload do aplicativo atual |

em:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` A seguir estão os arquivos auxiliares do agente mantidos pela CLI
- `NB_CLI_ROOT/test2/storage/...` A seguir estão os recursos estáticos e diretórios de upload do próprio aplicativo
- `nocobase.caddy` é um arquivo de entrada no nível do provedor e geralmente não precisa ser modificado manualmente.
- `app.caddy` é a configuração completa do site Caddy de um determinado ambiente. A reexecução de `generate` substituirá todo o

:::nota de aviso

Se quiser compensar a configuração no nível do site do Caddy, como cabeçalhos adicionais, autenticação, limitação de velocidade ou estratégias de compactação, você pode primeiro ajustar com base em `app.caddy`; no entanto, esteja ciente de que as reexecuções subsequentes de `generate` substituirão este arquivo.

:::

## Configuração manuscrita: o que fazer sem CLI

Se o seu aplicativo não estiver hospedado na CLI ou se você desejar explicitamente manter a configuração completa do Caddy, também poderá escrevê-lo manualmente.

Entretanto, para o NocoBase, a entrada do ambiente de produção geralmente não é apenas um simples `reverse_proxy`. Além de encaminhar solicitações de API para o aplicativo de back-end, uma configuração Caddy completa também precisa tratar o diretório de upload, recursos estáticos de front-end, a rota de acesso a arquivos `/files/`, o roteamento `.well-known`, WebSocket e as páginas de fallback da SPA.

Tomando `test2` como exemplo, os principais diretórios relacionados ao Caddy geralmente incluem:

- Diretório da página substituta do SPA: `NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public`
- Diretório de produto de compilação de front-end: `NB_CLI_ROOT/test2/storage/dist-client`
- Diretório de upload: `NB_CLI_ROOT/test2/storage/uploads`

Em outras palavras, a configuração manuscrita geralmente precisa cobrir pelo menos os seguintes tipos de entradas:

- `v`: Redirecionar `/v` para `/v/`
- `uploads`: Expõe o diretório de upload
- `dist`: Exponha o diretório do produto de compilação front-end
- `oauth well-known`: Lidar com caminhos de descoberta OAuth
- `openid well-known`: Lidar com caminhos de descoberta OpenID
- `files`: encaminhar solicitações de acesso a arquivos sob `/files/` para o aplicativo de back-end
- `api`: encaminha a solicitação `/api/` para o aplicativo back-end
- `ws`: encaminha solicitações WebSocket para o aplicativo backend
- `spa v2`: Fornece entrada de front-end e página de retorno para `/v/`
- `spa v1`: fornece entrada de front-end e página de retorno para `/`

Portanto, uma configuração completa do Caddy geralmente não é escrita apenas da seguinte maneira geral:

```text
your-domain.com {
  reverse_proxy 127.0.0.1:13000
}
```

Para um aplicativo hospedado em CLI como `test2`, uma estrutura mais próxima de uma implantação real normalmente seria assim:

```text
c.local.nocobase.com {
    encode zstd gzip

    handle /v {
        redir * /v/ 302
    }

    handle_path /storage/uploads/* {
        root * NB_CLI_ROOT/test2/storage/uploads
        header Cache-Control public
        header X-Content-Type-Options nosniff
        file_server
    }

    handle_path /dist/* {
        root * NB_CLI_ROOT/test2/storage/dist-client
        header Cache-Control public
        file_server
    }

    @oauth path_regexp oauth ^/\\.well-known/oauth-authorization-server/(.+)$
    handle @oauth {
        rewrite * /{re.oauth.1}/.well-known/oauth-authorization-server
        reverse_proxy host.docker.internal:56575
    }

    @openid path_regexp openid ^/\\.well-known/openid-configuration/(.+)$
    handle @openid {
        rewrite * /{re.openid.1}/.well-known/openid-configuration
        reverse_proxy host.docker.internal:56575
    }

    handle /files/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /api/* {
        reverse_proxy host.docker.internal:56575
    }

    handle /ws {
        reverse_proxy host.docker.internal:56575
    }

    handle_path /v/* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v2.html
        file_server
    }

    handle_path /* {
        root * NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public
        header Cache-Control "no-store, no-cache, must-revalidate"
        header X-Robots-Tag "noindex, nofollow"
        try_files {path} /index-v1.html
        file_server
    }
}
```

Existem também dois pontos-chave aqui:

- `NB_CLI_ROOT/.nocobase/proxy/caddy/...` A seguir está o diretório da página de reversão do SPA mantido pela CLI
- `NB_CLI_ROOT/test2/storage/...` A seguir está o uso de seu próprio diretório de produto de construção e diretório de upload

Se o seu aplicativo usar implantação de subcaminho ou se os recursos front-end, o diretório de upload e a camada de entrada não estiverem na mesma perspectiva de caminho, a configuração manuscrita estará mais sujeita a erros. Neste cenário, normalmente é mais recomendado executar:

```bash
nb proxy caddy generate --env test2 --host c.local.nocobase.com
```

Em seguida, faça ajustes com base nos resultados gerados.

Se você quiser deixar a CLI ajudá-lo a percorrer os caminhos e rotas primeiro, a estrutura gerada geralmente será:

```text
NB_CLI_ROOT/.nocobase/proxy/caddy/nocobase.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/app.caddy
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v1.html
NB_CLI_ROOT/.nocobase/proxy/caddy/test2/public/index-v2.html
NB_CLI_ROOT/test2/storage/dist-client
NB_CLI_ROOT/test2/storage/uploads
```

em:

- `nocobase.caddy` é responsável por unificar `import */app.caddy`
- `test2/app.caddy` é a configuração completa do site deste ambiente `test2`
- `public/index-v1.html` e `public/index-v2.html` são páginas substitutas de SPA geradas por CLI

Uma abordagem mais prudente é geralmente:

1. Primeiro deixe a CLI gerar a configuração do Caddy
2. Confirme a estrutura de roteamento e o caminho real com base nos resultados gerados.
3. Em seguida, faça ajustes manuais de acordo com seu nome de domínio, modo de execução e caminho de montagem.

Geralmente, é menos provável que você deixe de tratar detalhes relacionados a `/files/`, WebSockets, recursos estáticos, diretórios de upload, rotas `.well-known` ou páginas de fallback da SPA do que ao escrever uma configuração do zero.

:::warning Atenção

`/files/` é uma rota da aplicação que precisa passar pela autorização do NocoBase. Não a trate como um diretório estático nem permita que ela caia no fallback da SPA. Encaminhe-a para o back-end do NocoBase e coloque a regra antes de `handle_path /*` e das demais regras de fallback do front-end.

Se `APP_PUBLIC_PATH=/nocobase/` estiver configurado, encaminhe também `/nocobase/files/*`. Mantenha a regra `/files/*` na raiz para compatibilidade com URLs de arquivos existentes.

:::

## Verifique e recarregue a configuração

Se você escrever ou ajustar manualmente a configuração do Caddy, verifique-a primeiro após fazer as alterações e depois recarregue:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Se você não estiver usando `systemd` para gerenciar o Caddy, você pode usar seus próprios métodos de inicialização e recarga.

Se você gerencia a camada de entrada por meio de `nb proxy caddy`, geralmente é preferível usar:

```bash
nb proxy caddy reload
```

Se quiser ver o driver atual, o caminho total do arquivo de entrada, o diretório raiz do tempo de execução e o contêiner ou informações binárias locais, você pode executar:

```bash
nb proxy caddy info
```

Se quiser apenas confirmar rapidamente se está em execução, você pode executar:

```bash
nb proxy caddy status
```

## Instruções comuns

- `nb proxy caddy generate` é para aplicativos instalados por `nb init`
- Se você já possui um nome de domínio que pode ser resolvido normalmente no servidor, o Caddy costuma ser a maneira mais rápida de obter HTTPS.
- Se você alterar posteriormente configurações como `app-port` e `app-public-path` que afetarão os resultados do proxy, lembre-se de executar novamente `generate`

## Links relacionados

- [Proxy reverso do ambiente de produção](./index.md)
- [Nginx](./nginx.md)
- [Instalar usando CLI (recomendado)](../../installation/cli.md)
- [Configuração do aplicativo com `.env`](../../installation/env.md)
- [`nb proxy caddy` Referência de comando](../../../api/cli/proxy/caddy/index.md)
