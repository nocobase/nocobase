:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/route).
:::

# ctx.route

Informações de correspondência da rota atual, correspondendo ao conceito de `route` do React Router. É usado para obter a configuração da rota correspondente atual, parâmetros e muito mais. Geralmente é usado em conjunto com `ctx.router` e `ctx.location`.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField** | Realizar renderização condicional ou exibir o identificador da página atual com base em `route.pathname` ou `route.params`. |
| **Regras de ligação / Fluxo de eventos** | Ler parâmetros de rota (ex: `params.name`) para ramificação lógica ou para passá-los para componentes filhos. |
| **Navegação de visualização** | Comparar internamente `ctx.route.pathname` com um caminho de destino para determinar se deve disparar `ctx.router.navigate`. |

> Observação: `ctx.route` está disponível apenas em ambientes RunJS que contenham um contexto de roteamento (como JSBlocks dentro de uma página, páginas de Fluxo, etc.). Pode ser nulo em contextos puramente de backend ou sem roteamento (como fluxos de trabalho).

## Definição de tipo

```ts
type RouteOptions = {
  name?: string;   // Identificador único da rota
  path?: string;   // Modelo da rota (ex: /admin/:name)
  params?: Record<string, any>;  // Parâmetros da rota (ex: { name: 'users' })
  pathname?: string;  // Caminho completo da rota atual (ex: /admin/users)
};
```

## Campos comuns

| Campo | Tipo | Descrição |
|------|------|------|
| `pathname` | `string` | O caminho completo da rota atual, consistente com `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Parâmetros dinâmicos extraídos do modelo da rota, como `{ name: 'users' }`. |
| `path` | `string` | O modelo da rota, como `/admin/:name`. |
| `name` | `string` | Identificador único da rota, comumente usado em cenários de múltiplas abas ou múltiplas visualizações. |

## Relação com ctx.router e ctx.location

| Finalidade | Uso recomendado |
|------|----------|
| **Ler caminho atual** | `ctx.route.pathname` ou `ctx.location.pathname`; ambos são consistentes durante a correspondência. |
| **Ler parâmetros de rota** | `ctx.route.params`, ex: `params.name` representando o UID da página atual. |
| **Navegação** | `ctx.router.navigate(path)` |
| **Ler parâmetros de consulta, state** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` foca na "configuração da rota correspondente", enquanto `ctx.location` foca na "localização atual da URL". Juntos, eles fornecem uma descrição completa do estado de roteamento atual.

## Exemplos

### Lendo o pathname

```ts
// Exibe o caminho atual
ctx.message.info('Página atual: ' + ctx.route.pathname);
```

### Ramificação baseada em params

```ts
// params.name geralmente é o UID da página atual (ex: identificador de uma página de fluxo)
if (ctx.route.params?.name === 'users') {
  // Executa uma lógica específica na página de gerenciamento de usuários
}
```

### Exibindo em uma página de Fluxo

```tsx
<div>
  <h1>Página atual - {ctx.route.pathname}</h1>
  <p>Identificador da rota: {ctx.route.params?.name}</p>
</div>
```

## Relacionado

- [ctx.router](./router.md): Navegação de rota. Quando `ctx.router.navigate()` altera o caminho, o `ctx.route` será atualizado adequadamente.
- [ctx.location](./location.md): Localização atual da URL (pathname, search, hash, state), usado em conjunto com `ctx.route`.