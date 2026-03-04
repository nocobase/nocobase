:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/location).
:::

# ctx.location

Informações de localização da rota atual, equivalente ao objeto `location` do React Router. Geralmente é usado em conjunto com `ctx.router` e `ctx.route` para ler o caminho atual, string de consulta (query string), hash e o estado (state) passado através da rota.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField** | Realiza renderização condicional ou ramificação lógica com base no caminho atual, parâmetros de consulta ou hash. |
| **Regras de vinculação / Fluxo de eventos** | Lê parâmetros de consulta da URL para filtragem vinculada ou determina a origem com base em `location.state`. |
| **Processamento pós-navegação** | Recebe dados passados da página anterior via `ctx.router.navigate` usando `ctx.location.state` na página de destino. |

> Nota: `ctx.location` está disponível apenas em ambientes RunJS com um contexto de roteamento (ex: JSBlock dentro de uma página, fluxos de eventos, etc.); pode ser nulo em contextos puramente de backend ou sem roteamento (ex: fluxos de trabalho).

## Definição de tipo

```ts
location: Location;
```

`Location` vem de `react-router-dom`, consistente com o valor de retorno de `useLocation()` do React Router.

## Campos comuns

| Campo | Tipo | Descrição |
|------|------|------|
| `pathname` | `string` | O caminho atual, começando com `/` (ex: `/admin/users`). |
| `search` | `string` | A string de consulta, começando com `?` (ex: `?page=1&status=active`). |
| `hash` | `string` | O fragmento hash, começando com `#` (ex: `#section-1`). |
| `state` | `any` | Dados arbitrários passados via `ctx.router.navigate(path, { state })`, não refletidos na URL. |
| `key` | `string` | Um identificador único para esta localização; a página inicial é `"default"`. |

## Relação com ctx.router e ctx.urlSearchParams

| Finalidade | Uso recomendado |
|------|----------|
| **Ler caminho, hash, state** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Ler parâmetros de consulta (como objeto)** | `ctx.urlSearchParams`, que fornece o objeto analisado diretamente. |
| **Analisar string de busca** | `new URLSearchParams(ctx.location.search)` ou use `ctx.urlSearchParams` diretamente. |

`ctx.urlSearchParams` é analisado a partir de `ctx.location.search`. Se você precisar apenas dos parâmetros de consulta, usar `ctx.urlSearchParams` é mais conveniente.

## Exemplos

### Ramificação com base no caminho

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Atualmente na página de gerenciamento de usuários');
}
```

### Analisando parâmetros de consulta

```ts
// Método 1: Usando ctx.urlSearchParams (Recomendado)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Método 2: Usando URLSearchParams para analisar a busca
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Recebendo estado passado via navegação de rota

```ts
// Ao navegar da página anterior: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Navegou a partir do painel (dashboard)');
}
```

### Localizando âncoras via hash

```ts
const hash = ctx.location.hash; // ex: "#edit"
if (hash === '#edit') {
  // Rolar para a área de edição ou executar a lógica correspondente
}
```

## Relacionado

- [ctx.router](./router.md): Navegação de rota; o `state` de `ctx.router.navigate` pode ser recuperado via `ctx.location.state` na página de destino.
- [ctx.route](./route.md): Informações de correspondência da rota atual (parâmetros, configuração, etc.), frequentemente usado em conjunto com `ctx.location`.