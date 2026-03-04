:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/on).
:::

# ctx.on()

Inscreva-se em eventos de contexto (como mudanças de valor de campo, mudanças de propriedade, atualização de recursos, etc.) no RunJS. Os eventos são mapeados para eventos DOM personalizados em `ctx.element` ou eventos do barramento interno de `ctx.resource` com base em seu tipo.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSField / JSEditableField** | Escuta mudanças no valor do campo vindas de fontes externas (formulários, vinculações, etc.) para atualizar a UI de forma síncrona, alcançando o vínculo bidirecional (two-way binding). |
| **JSBlock / JSItem / JSColumn** | Escuta eventos personalizados no contêiner para responder a mudanças de dados ou estado. |
| **Relacionado a resource** | Escuta eventos de ciclo de vida do recurso, como atualização ou salvamento, para executar lógica após a atualização dos dados. |

## Definição de Tipo

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Eventos Comuns

| Nome do Evento | Descrição | Origem do Evento |
|--------|------|----------|
| `js-field:value-change` | Valor do campo modificado externamente (ex: vinculação de formulário, atualização de valor padrão) | CustomEvent em `ctx.element`, onde `ev.detail` é o novo valor |
| `resource:refresh` | Os dados do recurso foram atualizados | Barramento de eventos de `ctx.resource` |
| `resource:saved` | Salvamento do recurso concluído | Barramento de eventos de `ctx.resource` |

> Regra de mapeamento de eventos: Eventos com o prefixo `resource:` passam por `ctx.resource.on`, enquanto outros geralmente passam por eventos DOM em `ctx.element` (se existir).

## Exemplos

### Vínculo bidirecional de campo (React useEffect + Limpeza)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Escuta de DOM nativo (Alternativa quando ctx.on não está disponível)

```ts
// Quando ctx.on não for fornecido, você pode usar ctx.element diretamente
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Durante a limpeza: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Atualizando a UI após a atualização do recurso

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Atualiza a renderização com base nos dados
});
```

## Coordenação com ctx.off

- Os ouvintes (listeners) registrados usando `ctx.on` devem ser removidos no momento apropriado via [ctx.off](./off.md) para evitar vazamentos de memória ou disparos duplicados.
- No React, o `ctx.off` é geralmente chamado dentro da função de limpeza (cleanup) do `useEffect`.
- O `ctx.off` pode não existir; recomenda-se usar o encadeamento opcional (optional chaining): `ctx.off?.('eventName', handler)`.

## Observações

1. **Cancelamento em par**: Cada `ctx.on(eventName, handler)` deve ter um `ctx.off(eventName, handler)` correspondente, e a referência do `handler` passada deve ser idêntica.
2. **Ciclo de vida**: Remova os ouvintes antes que o componente seja desmontado ou o contexto seja destruído para evitar vazamentos de memória.
3. **Disponibilidade de eventos**: Diferentes tipos de contexto suportam eventos diferentes. Consulte a documentação específica do componente para mais detalhes.

## Documentação Relacionada

- [ctx.off](./off.md) - Remover ouvintes de eventos
- [ctx.element](./element.md) - Contêiner de renderização e eventos DOM
- [ctx.resource](./resource.md) - Instância de recurso e seus métodos `on`/`off`
- [ctx.setValue](./set-value.md) - Define o valor do campo (dispara `js-field:value-change`)