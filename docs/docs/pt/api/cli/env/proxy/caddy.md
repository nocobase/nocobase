# nb env proxy caddy

`nb env proxy caddy` gera a configuração Caddy para um env gerenciado pela CLI. Use este comando quando você já tem um domínio e quer colocar o HTTPS no ar rapidamente, com menos detalhes de TLS para manter manualmente.

## Uso

```bash
nb env proxy caddy [name] [flags]
```

## Parâmetros principais

- `--env`, `-e`: especifica explicitamente o env
- `--host`: host público gravado na configuração de entrada
- `--port`: porta pública da entrada do proxy
- `--output`, `-o`: grava apenas o fragmento de rotas gerado
- `--install`: conecta a configuração compartilhada à configuração principal do Caddy
- `--reload`: valida e recarrega o Caddy
- `--print`: exibe a configuração gerada sem gravar arquivos

## Observações

- Funciona apenas para envs `local` e `docker`
- `--host` é importante porque o Caddy decide o HTTPS com base no endereço do site
- Se o comando disser que o env não tem `appPort`, execute primeiro `nb env update <name> --app-port <port>`
- Se você mudar `app-port` ou `app-public-path`, normalmente precisará executar novamente `nb env proxy caddy`
