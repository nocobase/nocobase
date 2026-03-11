:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/runjs/context/model).
:::

# ctx.model

A instância `FlowModel` onde o contexto de execução atual do RunJS está localizado. Serve como o ponto de entrada padrão para cenários como JSBlock, JSField e JSAction. O tipo específico varia conforme o contexto: pode ser uma subclasse como `BlockModel`, `ActionModel` ou `JSEditableFieldModel`.

## Cenários de uso

| Cenário | Descrição |
|------|------|
| **JSBlock** | `ctx.model` é o modelo de bloco atual. Você pode acessar `resource`, `coleção`, `setProps`, etc. |
| **JSField / JSItem / JSColumn** | `ctx.model` é o modelo de campo. Você pode acessar `setProps`, `dispatchEvent`, etc. |
| **Eventos de Ação / ActionModel** | `ctx.model` é o modelo de ação. Você pode ler/escrever parâmetros de etapa, disparar eventos, etc. |

> Dica: Se você precisar acessar o **bloco pai que contém o JS atual** (ex: um bloco de Formulário ou Tabela), use `ctx.blockModel`. Para acessar **outros modelos**, use `ctx.getModel(uid)`.

## Definição de Tipo

```ts
model: FlowModel;
```

`FlowModel` é a classe base. Em tempo de execução, ela é uma instância de várias subclasses (como `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, etc.). As propriedades e métodos disponíveis dependem do tipo específico.

## Propriedades Comuns

| Propriedade | Tipo | Descrição |
|------|------|------|
| `uid` | `string` | Identificador único do modelo. Pode ser usado para `ctx.getModel(uid)` ou vinculação de UID de pop-up. |
| `collection` | `Collection` | A coleção vinculada ao modelo atual (existe quando o bloco/campo está vinculado a dados). |
| `resource` | `Resource` | Instância de recurso associada, usada para atualizar, obter linhas selecionadas, etc. |
| `props` | `object` | Configuração de UI/comportamento do modelo. Pode ser atualizada usando `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Coleção de submodelos (ex: campos dentro de um formulário, colunas dentro de uma tabela). |
| `parent` | `FlowModel` | Modelo pai (se houver). |

## Métodos Comuns

| Método | Descrição |
|------|------|
| `setProps(partialProps: any): void` | Atualiza a configuração do modelo e dispara a renderização (ex: `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Dispara um evento para o modelo, ativando fluxos de trabalho configurados nesse modelo que escutam o nome do evento. O `payload` opcional é passado para o manipulador do fluxo de trabalho; `options.debounce` permite o controle de debounce. |
| `getStepParams?.(flowKey, stepKey)` | Lê os parâmetros das etapas do fluxo de configuração (usado em painéis de configurações, ações personalizadas, etc.). |
| `setStepParams?.(flowKey, stepKey, params)` | Escreve os parâmetros das etapas do fluxo de configuração. |

## Relação com ctx.blockModel e ctx.getModel

| Necessidade | Uso Recomendado |
|------|----------|
| **Modelo do contexto de execução atual** | `ctx.model` |
| **Bloco pai do JS atual** | `ctx.blockModel`. Frequentemente usado para acessar `resource`, `form` ou `coleção`. |
| **Obter qualquer modelo por UID** | `ctx.getModel(uid)` ou `ctx.getModel(uid, true)` (busca em todas as pilhas de visualização). |

Em um JSField, `ctx.model` é o modelo de campo, enquanto `ctx.blockModel` é o bloco de Formulário ou Tabela que contém esse campo.

## Exemplos

### Atualizando o status do bloco/ação

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Disparando eventos de modelo

```ts
// Dispara um evento para ativar um fluxo de trabalho configurado neste modelo que escuta este nome de evento
await ctx.model.dispatchEvent('remove');

// Quando um payload é fornecido, ele é passado para o ctx.inputArgs do manipulador do fluxo de trabalho
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### Usando UID para vinculação de pop-up ou acesso entre modelos

```ts
const myUid = ctx.model.uid;
// Na configuração do pop-up, você pode passar openerUid: myUid para associação
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Relacionado

- [ctx.blockModel](./block-model.md): O modelo de bloco pai onde o JS atual está localizado.
- [ctx.getModel()](./get-model.md): Obter outros modelos por UID.