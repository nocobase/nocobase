:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/off).
:::

# ctx.off()

Remove os ouvintes de eventos registrados via `ctx.on(eventName, handler)`. É frequentemente utilizado em conjunto com [ctx.on](./on.md) para cancelar a assinatura no momento apropriado, evitando vazamentos de memória ou gatilhos duplicados.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **Limpeza no useEffect do React** | Chamado dentro da função de limpeza (*cleanup*) do `useEffect` para remover ouvintes quando o componente é desmontado. |
| **JSField / JSEditableField** | Cancela a assinatura de `js-field:value-change` durante a vinculação de dados bidirecional para campos. |
| **Relacionado a resource** | Cancela a assinatura de ouvintes como `refresh` ou `saved` registrados via `ctx.resource.on`. |

## Definição de Tipo

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Exemplos

### Uso pareado no useEffect do React

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Cancelando a assinatura de eventos de recurso

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// No momento apropriado
ctx.resource?.off('refresh', handler);
```

## Observações

1. **Referência consistente do handler**: O `handler` passado para `ctx.off` deve ser a mesma referência utilizada em `ctx.on`; caso contrário, ele não poderá ser removido corretamente.
2. **Limpeza oportuna**: Chame `ctx.off` antes que o componente seja desmontado ou o contexto seja destruído para evitar vazamentos de memória.

## Documentos Relacionados

- [ctx.on](./on.md) - Inscrever-se em eventos
- [ctx.resource](./resource.md) - Instância de recurso e seus métodos `on`/`off`