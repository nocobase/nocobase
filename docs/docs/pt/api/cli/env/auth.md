---
title: "nb env auth"
description: "Referência do comando nb env auth: autentica um env do NocoBase já salvo com basic, token ou OAuth."
keywords: "nb env auth,NocoBase CLI,basic,token,OAuth,login,autenticação"
---

# nb env auth

Autentica novamente um env do NocoBase já salvo ou atualiza as informações de autenticação salvas para ele. Quando o nome do ambiente é omitido, usa o env atual.

`nb env auth` oferece suporte a três métodos de autenticação: `basic`, `token` e `oauth`. Se `--auth-type` for omitido, a CLI primeiro infere o método a partir das opções de autenticação informadas. Se ainda não conseguir inferir, usa o método de autenticação já salvo no env.

## Uso

```bash
nb env auth [name] [flags]
```

## Parâmetros

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `[name]` | string | Nome do ambiente configurado no qual fazer login; quando omitido, usa o env atual |
| `--auth-type`, `-a` | string | Método de autenticação: `basic`, `token` ou `oauth` |
| `--access-token`, `-t` | string | API key ou access token usado com a autenticação `token` |
| `--username` | string | Nome de usuário usado com a autenticação `basic`; solicitado em TTY quando omitido |
| `--password` | string | Senha usada com a autenticação `basic`; solicitada em TTY quando omitida |

## Opções de compatibilidade

| Opção | Tipo | Descrição |
| --- | --- | --- |
| `--env`, `-e` | string | Nome do ambiente, equivalente a `[name]`. Esta opção oculta é mantida para compatibilidade com outros comandos; normalmente o argumento posicional é suficiente |

## Descrição

Os métodos de autenticação funcionam assim:

- `basic`: faz login no NocoBase com nome de usuário e senha, depois salva o access token retornado e o nome de usuário
- `token`: salva a API key ou o access token passado por `--access-token`
- `oauth`: inicia o fluxo de autenticação no navegador e salva o access token depois que a autenticação termina

Em um terminal interativo, a CLI solicita `--auth-type`, `--username`, `--password` ou `--access-token` quando necessário. Em modo não interativo, a autenticação `basic` exige `--username` e `--password`.

A autenticação `oauth` tenta primeiro Device Authorization Grant. Quando o servidor OAuth oferece suporte a esse fluxo, o comando imprime uma URL de verificação e um código de usuário, e depois faz polling até a aprovação no navegador ser concluída. Isso funciona em servidores remotos ou headless porque não exige um listener de callback local.

Se o servidor OAuth não expõe um device authorization endpoint, o comando volta para o fluxo PKCE loopback: inicia um serviço de callback local, abre o navegador para autorização, troca o token e o salva no arquivo de configuração.

Depois que a autenticação é concluída com sucesso, a CLI executa automaticamente `nb env update <name>` para ressincronizar o estado do env.

## Limites

- `[name]` e `--env` não podem informar nomes de ambiente diferentes ao mesmo tempo
- `--access-token` não pode ser usado com `--username` ou `--password`
- `--auth-type oauth` não pode ser usado com `--access-token`, `--username` ou `--password`
- `--auth-type token` não pode ser usado com `--username` ou `--password`
- `--auth-type basic` não pode ser usado com `--access-token`
- `--access-token`, `--username` e `--password` não podem estar vazios depois de informados

## Exemplos

```bash
# Autenticar o env atual com o método de autenticação salvo
nb env auth

# Autenticar um env específico
nb env auth prod

# Usar login OAuth no navegador
nb env auth prod --auth-type oauth

# Fazer login com nome de usuário e senha
nb env auth prod --auth-type basic --username admin --password secret

# Salvar uma API key ou access token
nb env auth prod --auth-type token --access-token <api-key>
```

Para device authorization, siga a URL impressa pelo comando e insira no navegador o código exibido.

## Comandos relacionados

- [`nb env add`](./add.md)
- [`nb env info`](./info.md)
- [`nb env update`](./update.md)
