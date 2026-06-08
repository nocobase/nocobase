# nb env proxy nginx

`nb env proxy nginx` gera a configuração Nginx para um env gerenciado pela CLI. Use este comando quando você já gerencia sites com Nginx ou ainda quer continuar cuidando de certificados, cache e controle de acesso.

## Uso

```bash
nb env proxy nginx [name] [flags]
```

## Parâmetros principais

- `--env`, `-e`: especifica explicitamente o env
- `--host`: host público gravado na configuração de entrada
- `--port`: porta pública da entrada do proxy
- `--install`: conecta a configuração compartilhada à configuração principal do Nginx
- `--reload`: valida e recarrega o Nginx
- `--print`: exibe o `app.conf` renderizado sem gravar arquivos

## Observações

- Funciona apenas para envs `local` e `docker`
- O provider Nginx não oferece suporte a `--output`
- Se o comando disser que o env não tem `appPort`, execute primeiro `nb env update <name> --app-port <port>`
- Se você mudar `app-port` ou `app-public-path`, normalmente precisará executar novamente `nb env proxy nginx`
