:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/view).
:::

# ctx.view

O controlador da visualização (view) atualmente ativa (janela modal, gaveta, popover, área incorporada, etc.), usado para acessar informações e operações em nível de visualização. Fornecido pelo `FlowViewContext`, ele está disponível apenas dentro do conteúdo de visualizações abertas via `ctx.viewer` ou `ctx.openView`.

## Casos de Uso

| Cenário | Descrição |
|------|------|
| **Conteúdo de Janela Modal/Gaveta** | Use `ctx.view.close()` dentro do `content` para fechar a visualização atual, ou use `Header` e `Footer` para renderizar títulos e rodapés. |
| **Após o envio do formulário** | Chame `ctx.view.close(result)` após um envio bem-sucedido para fechar a visualização e retornar o resultado. |
| **JSBlock / Ação** | Determine o tipo de visualização atual via `ctx.view.type` ou leia os parâmetros de abertura em `ctx.view.inputArgs`. |
| **Seleção de Associação, Subtabelas** | Leia `collectionName`, `filterByTk`, `parentId`, etc., de `inputArgs` para o carregamento de dados. |

> Nota: `ctx.view` está disponível apenas em ambientes RunJS com um contexto de visualização (por exemplo, dentro do `content` de `ctx.viewer.dialog()`, em formulários de janela modal ou dentro de seletores de associação). Em páginas comuns ou contextos de backend, ele é `undefined`. Recomenda-se usar encadeamento opcional (`ctx.view?.close?.()`).

## Definição de Tipo

```ts
type FlowView = {
  type: 'drawer' | 'popover' | 'dialog' | 'embed';
  inputArgs: Record<string, any>;
  Header: React.FC<{ title?: React.ReactNode; extra?: React.ReactNode }> | null;
  Footer: React.FC<{ children?: React.ReactNode }> | null;
  close: (result?: any, force?: boolean) => void;
  update: (newConfig: any) => void;
  navigation?: ViewNavigation;
  destroy?: () => void;
  submit?: () => Promise<any>;  // Disponível em visualizações de configuração de fluxo de trabalho
};
```

## Propriedades e Métodos Comuns

| Propriedade/Método | Tipo | Descrição |
|-----------|------|------|
| `type` | `'drawer' \| 'popover' \| 'dialog' \| 'embed'` | Tipo de visualização atual |
| `inputArgs` | `Record<string, any>` | Parâmetros passados ao abrir a visualização (veja abaixo) |
| `Header` | `React.FC \| null` | Componente de cabeçalho, usado para renderizar títulos e áreas de ação |
| `Footer` | `React.FC \| null` | Componente de rodapé, usado para renderizar botões, etc. |
| `close(result?, force?)` | `void` | Fecha a visualização atual; o `result` pode ser retornado para quem a chamou |
| `update(newConfig)` | `void` | Atualiza a configuração da visualização (ex: largura, título) |
| `navigation` | `ViewNavigation \| undefined` | Navegação de visualização na página, incluindo troca de abas, etc. |

> Atualmente, apenas `dialog` (janela modal) e `drawer` (gaveta) suportam `Header` e `Footer`.

## Campos comuns em inputArgs

Os campos em `inputArgs` variam dependendo do cenário de abertura. Campos comuns incluem:

| Campo | Descrição |
|------|------|
| `viewUid` | UID da visualização |
| `collectionName` | Nome da coleção |
| `filterByTk` | Filtro por chave primária (para detalhes de um único registro) |
| `parentId` | ID pai (para cenários de associação) |
| `sourceId` | ID do registro de origem |
| `parentItem` | Dados do item pai |
| `scene` | Cenário (ex: `create`, `edit`, `select`) |
| `onChange` | Callback após seleção ou alteração |
| `tabUid` | UID da aba atual (dentro de uma página) |

Acesse-os via `ctx.getVar('ctx.view.inputArgs.xxx')` ou `ctx.view.inputArgs.xxx`.

## Exemplos

### Fechando a visualização atual

```ts
// Fecha a janela modal após o envio bem-sucedido
await ctx.resource.runAction('create', { data: formData });
ctx.view?.close();

// Fecha e retorna resultados
ctx.view?.close({ id: newRecord.id, name: newRecord.name });
```

### Usando Header / Footer no conteúdo

```tsx
function DialogContent() {
  const ctx = useFlowViewContext();
  const { Header, Footer, close } = ctx.view;
  return (
    <div>
      <Header title="Editar" extra={<Button size="small">Ajuda</Button>} />
      <div>Conteúdo do formulário...</div>
      <Footer>
        <Button onClick={() => close()}>Cancelar</Button>
        <Button type="primary" onClick={handleSubmit}>Enviar</Button>
      </Footer>
    </div>
  );
}
```

### Ramificação baseada no tipo de visualização ou inputArgs

```ts
if (ctx.view?.type === 'embed') {
  // Oculta o cabeçalho em visualizações incorporadas
  ctx.model.setProps('headerStyle', { display: 'none' });
}

const collectionName = ctx.view?.inputArgs?.collectionName;
if (collectionName === 'users') {
  // Cenário de seletor de usuários
}
```

## Relação com ctx.viewer e ctx.openView

| Finalidade | Uso recomendado |
|------|----------|
| **Abrir uma nova visualização** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` ou `ctx.openView()` |
| **Operar na visualização atual** | `ctx.view.close()`, `ctx.view.update()` |
| **Obter parâmetros de abertura** | `ctx.view.inputArgs` |

O `ctx.viewer` é responsável por "abrir" uma visualização, enquanto o `ctx.view` representa a instância da visualização "atual". O `ctx.openView` é usado para abrir visualizações de fluxo de trabalho pré-configuradas.

## Observações

- `ctx.view` está disponível apenas dentro de uma visualização; ele é `undefined` em páginas comuns.
- Use encadeamento opcional: `ctx.view?.close?.()` para evitar erros quando não houver contexto de visualização.
- O `result` de `close(result)` é passado para a Promise retornada por `ctx.viewer.open()`.

## Relacionados

- [ctx.openView()](./open-view.md): Abre uma visualização de fluxo de trabalho pré-configurada
- [ctx.modal](./modal.md): Popups leves (informações, confirmação, etc.)

> O `ctx.viewer` fornece métodos como `dialog()`, `drawer()`, `popover()` e `embed()` para abrir visualizações. O `content` aberto por esses métodos pode acessar o `ctx.view`.