---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Chamar APIs de subaplicações'
description: 'Como chamar APIs de subaplicações em multiaplicação: acessar pela aplicação de entrada e especificar a subaplicação por prefixo de caminho, cabeçalho ou parâmetro de consulta.'
keywords: 'multiaplicação,API de subaplicação,AppSupervisor,aplicação de entrada,chamada API,NocoBase'
---

# Chamar APIs de subaplicações

Em multiaplicação, cada subaplicação tem suas próprias APIs. Ao chamar uma API de subaplicação, a aplicação de entrada precisa saber para qual subaplicação a requisição deve ser roteada.

Por exemplo, uma API da aplicação principal geralmente é:

```bash
GET /api/users:list
```

`/api` é o prefixo padrão da API e pode ser personalizado pela variável de ambiente `API_BASE_PATH`.

Para chamar a mesma API em uma subaplicação, informe o nome da subaplicação na requisição.

## Usar prefixo de caminho

Use o prefixo `/api/__app/<appName>/`:

```bash
GET /api/__app/a_xxx/users:list
```

Onde:

- `a_xxx` é o nome da subaplicação
- `users:list` é o recurso e a ação chamados
- `/api` é o caminho base da API do sistema atual

Parâmetros de consulta podem ser adicionados normalmente:

```bash
GET /api/__app/a_xxx/users:list?page=1&pageSize=20
```

Essa forma é clara e adequada para acesso unificado pela aplicação de entrada em deployments multiambiente.

## Usar cabeçalho de requisição

Se o chamador já usa um endereço fixo `/api/...`, especifique a subaplicação com o cabeçalho `X-App`:

```bash
curl \
  -H "X-App: a_xxx" \
  http://localhost:13003/api/users:list
```

Isso é adequado para chamadas backend ou utilitários frontend que centralizam URLs de API.

## Usar parâmetro de consulta

Também é possível usar o parâmetro `__appName`:

```bash
GET /api/users:list?__appName=a_xxx
```

Com outros parâmetros:

```bash
GET /api/users:list?__appName=a_xxx&page=1&pageSize=20
```

Em geral, prefixo de caminho ou cabeçalho deixam a subaplicação de destino mais explícita.

## Endereço API em multiambiente

Em multiambiente, normalmente há uma aplicação de entrada e vários ambientes de execução.

Exemplo:

- Aplicação de entrada: `http://localhost:13003`
- Ambiente de execução: `http://localhost:14000`

Recomenda-se chamar APIs de subaplicações pela aplicação de entrada:

```bash
GET http://localhost:13003/api/__app/a_xxx/users:list
```

A aplicação de entrada roteia a requisição conforme a configuração. Se você souber exatamente qual ambiente acessar, também pode usar o endereço dele.

```bash
GET http://localhost:14000/api/__app/a_xxx/users:list
```

## Domínios próprios de subaplicações

Se a subaplicação tiver domínio próprio, suas APIs também podem ser chamadas diretamente por esse domínio:

```bash
GET https://app-example.example.com/api/users:list
```

Para passar de forma unificada pela aplicação de entrada, continue usando `/api/__app/<appName>/...`.

## Autenticação

Ao chamar APIs de subaplicações, a verificação de permissões ainda é baseada na subaplicação de destino.

Isso significa:

- É necessário um estado de login ou token válido para a subaplicação
- O login na aplicação principal não equivale automaticamente a permissões de API na subaplicação

Sem autenticação válida, a subaplicação retorna erro de não autenticado ou sem permissão conforme sua configuração.
