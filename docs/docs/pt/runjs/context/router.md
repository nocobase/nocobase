:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/router).
:::

# ctx.router

Uma instância de roteador baseada no React Router, usada para navegação programática dentro do RunJS. Geralmente é utilizada em conjunto com `ctx.route` e `ctx.location`.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField** | Navegar para páginas de detalhes, páginas de lista ou links externos após o clique em um botão. |
| **Regras de Vinculação / Fluxo de Eventos** | Executar `navigate` para uma lista ou detalhe após uma submissão bem-sucedida, ou passar um `state` para a página de destino. |
| **JSAction / Manipulação de Eventos** | Executar a navegação de rota dentro de lógicas como submissões de formulários ou cliques em links. |
| **Navegação de Visualização** | Atualizar a URL via `navigate` durante a troca da pilha de visualização interna. |

> Nota: O `ctx.router` está disponível apenas em ambientes RunJS que possuem um contexto de roteamento (ex: JSBlock dentro de uma página, páginas de Fluxo, fluxos de eventos, etc.); ele pode ser nulo em contextos puramente de backend ou sem roteamento (ex: Fluxos de trabalho).

## Definição de Tipo

```typescript
router: Router
```

O `Router` é derivado do `@remix-run/router`. No RunJS, operações de navegação como ir para uma página, voltar e atualizar são implementadas via `ctx.router.navigate()`.

## Métodos

### ctx.router.navigate()

Navega para um caminho de destino ou executa uma ação de voltar/atualizar.

**Assinatura:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parâmetros:**

- `to`: Caminho de destino (string), posição relativa no histórico (number, ex: `-1` para voltar) ou `null` (para atualizar a página atual).
- `options`: Configuração opcional.
  - `replace?: boolean`: Se deve substituir a entrada atual no histórico (o padrão é `false`, que adiciona uma nova entrada/push).
  - `state?: any`: Estado a ser passado para a rota de destino. Estes dados não aparecem na URL e podem ser acessados via `ctx.location.state` na página de destino. É adequado para informações sensíveis, dados temporários ou informações que não devem ser colocadas na URL.

## Exemplos

### Navegação Básica

```ts
// Navegar para a lista de usuários (adiciona uma nova entrada no histórico, permite voltar)
ctx.router.navigate('/admin/users');

// Navegar para uma página de detalhes
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Substituindo o Histórico (Sem nova entrada)

```ts
// Redirecionar para a página inicial após o login; o usuário não voltará para a página de login ao clicar em voltar
ctx.router.navigate('/admin', { replace: true });

// Substituir a página atual pela página de detalhes após a submissão bem-sucedida de um formulário
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### Passando State

```ts
// Carregar dados durante a navegação; a página de destino os recupera via ctx.location.state
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Voltar e Atualizar

```ts
// Voltar uma página
ctx.router.navigate(-1);

// Voltar duas páginas
ctx.router.navigate(-2);

// Atualizar a página atual
ctx.router.navigate(null);
```

## Relação com ctx.route e ctx.location

| Finalidade | Uso Recomendado |
|------|----------|
| **Navegação/Salto** | `ctx.router.navigate(path)` |
| **Ler o caminho atual** | `ctx.route.pathname` ou `ctx.location.pathname` |
| **Ler o state passado durante a navegação** | `ctx.location.state` |
| **Ler parâmetros da rota** | `ctx.route.params` |

O `ctx.router` é responsável pelas "ações de navegação", enquanto o `ctx.route` e o `ctx.location` são responsáveis pelo "estado da rota atual".

## Notas

- `navigate(path)` adiciona uma nova entrada no histórico por padrão, permitindo que os usuários retornem através do botão voltar do navegador.
- `replace: true` substitui a entrada atual do histórico sem adicionar uma nova, o que é adequado para cenários como redirecionamento pós-login ou navegação após submissão bem-sucedida.
- **Sobre o parâmetro `state`**:
  - Os dados passados via `state` não aparecem na URL, tornando-os adequados para dados sensíveis ou temporários.
  - Podem ser acessados via `ctx.location.state` na página de destino.
  - O `state` é salvo no histórico do navegador e permanece acessível durante a navegação para frente/para trás.
  - O `state` será perdido após uma atualização forçada (refresh) da página.

## Relacionados

- [ctx.route](./route.md): Informações de correspondência da rota atual (pathname, params, etc.).
- [ctx.location](./location.md): Localização da URL atual (pathname, search, hash, state); o `state` é lido aqui após a navegação.