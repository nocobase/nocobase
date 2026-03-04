:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/libs).
:::

# ctx.libs

`ctx.libs` é o namespace unificado para as bibliotecas integradas no RunJS, contendo bibliotecas comumente usadas como React, Ant Design, dayjs e lodash. **Não é necessário `import` ou carregamento assíncrono**; elas podem ser usadas diretamente via `ctx.libs.xxx`.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Use React + Ant Design para renderizar UI, dayjs para manipulação de datas e lodash para processamento de dados. |
| **Fórmula / Cálculo** | Use formula ou math para fórmulas estilo Excel e operações de expressões matemáticas. |
| **Fluxo de trabalho / Regras de vinculação** | Chame bibliotecas de utilitários como lodash, dayjs e formula em cenários de lógica pura. |

## Visão Geral das Bibliotecas Integradas

| Propriedade | Descrição | Documentação |
|------|------|------|
| `ctx.libs.React` | Core do React, usado para JSX e Hooks | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | API de cliente do ReactDOM (incluindo `createRoot`), usada com React para renderização | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Biblioteca de componentes Ant Design (Button, Card, Table, Form, Input, Modal, etc.) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Biblioteca de ícones do Ant Design (ex: PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | Biblioteca de utilitários de data e hora | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | Biblioteca de utilitários (get, set, debounce, etc.) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Biblioteca de funções de fórmula estilo Excel (SUM, AVERAGE, IF, etc.) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | Biblioteca de expressões matemáticas e cálculos | [Math.js](https://mathjs.org/docs/) |

## Aliases de Nível Superior

Para compatibilidade com códigos legados, algumas bibliotecas também estão expostas no nível superior: `ctx.React`, `ctx.ReactDOM`, `ctx.antd` e `ctx.dayjs`. **Recomenda-se usar consistentemente `ctx.libs.xxx`** para facilitar a manutenção e a busca na documentação.

## Carregamento Preguiçoso (Lazy Loading)

`lodash`, `formula` e `math` utilizam **carregamento preguiçoso**: um import dinâmico é acionado apenas quando `ctx.libs.lodash` é acessado pela primeira vez, e o cache é reutilizado posteriormente. `React`, `antd`, `dayjs` e `antdIcons` são pré-configurados pelo contexto e estão disponíveis imediatamente.

## Exemplos

### Renderização com React e Ant Design

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="Título">
    <Button type="primary">Clique aqui</Button>
  </Card>
);
```

### Usando Hooks

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### Usando Ícones

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>Usuário</Button>);
```

### Processamento de Datas com dayjs

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### Funções Utilitárias com lodash

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### Cálculos de Fórmulas

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### Expressões Matemáticas com math.js

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## Observações

- **Misturando com ctx.importAsync**: Se um React externo for carregado via `ctx.importAsync('react@19')`, o JSX usará essa instância. Nesse caso, **não** misture com `ctx.libs.antd`. O Ant Design deve ser carregado para corresponder a essa versão do React (ex: `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **Múltiplas Instâncias do React**: Se ocorrer um erro de "Invalid hook call" ou se o hook dispatcher for nulo, isso geralmente é causado por múltiplas instâncias do React. Antes de ler `ctx.libs.React` ou chamar Hooks, execute `await ctx.importAsync('react@versão')` primeiro para garantir que a mesma instância do React seja compartilhada com a página.

## Relacionado

- [ctx.importAsync()](./import-async.md) - Carregue módulos ESM externos sob demanda (ex: versões específicas de React, Vue)
- [ctx.render()](./render.md) - Renderiza conteúdo para um contêiner