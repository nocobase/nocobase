---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/interface-builder/ui-templates).
:::

# Modelos de UI

## Introdução

Os modelos de interface (UI) são usados para reutilizar configurações na construção de interfaces, reduzindo a configuração repetitiva e mantendo várias configurações sincronizadas quando necessário.

Atualmente, os tipos de modelos suportados incluem:

- **Modelo de bloco**: Reutiliza configurações inteiras de um bloco.
- **Modelo de campo**: Reutiliza configurações da "área de campos" em blocos de formulário ou detalhes.
- **Modelo de pop-up**: Reutiliza configurações de janelas pop-up acionadas por ações ou campos.

## Conceitos Fundamentais

### Referência e Cópia

Existem geralmente duas maneiras de usar modelos:

- **Referência**: Vários locais compartilham a mesma configuração do modelo; modificar o modelo ou qualquer ponto de referência sincronizará as atualizações em todos os outros pontos de referência.
- **Cópia**: Duplica como uma configuração independente; modificações subsequentes não afetam umas às outras.

### Salvar como Modelo

Quando um bloco ou pop-up já está configurado, você pode usar a opção `Salvar como modelo` em seu menu de configurações e escolher o método de salvamento:

- **Converter o atual... em modelo**: Após salvar, a posição atual mudará para referenciar esse modelo.
- **Copiar o atual... como modelo**: Apenas cria o modelo; a posição atual permanece inalterada.

## Modelo de Bloco

### Salvar Bloco como Modelo

1) Abra o menu de configurações do bloco de destino e clique em `Salvar como modelo`.  
2) Preencha o `Nome do modelo` / `Descrição do modelo` e escolha o modo de salvamento:
   - **Converter o bloco atual em modelo**: Após salvar, a posição atual será substituída por um bloco de `Modelo de bloco` (ou seja, referenciando esse modelo).
   - **Copiar o bloco atual como modelo**: Apenas cria o modelo; o bloco atual permanece inalterado.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Usar Modelo de Bloco

1) Adicionar bloco → "Outros blocos" → `Modelo de bloco`.  
2) Na configuração, selecione:
   - **Modelo**: Escolha um modelo.
   - **Modo**: `Referência` ou `Cópia`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Converter Referência em Cópia

Quando um bloco está referenciando um modelo, você pode usar `Converter referência em cópia` no menu de configurações do bloco para transformá-lo em um bloco comum (desconectando a referência). Modificações subsequentes não afetarão o modelo original ou outras referências.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Observações

- O modo `Cópia` gerará novos UIDs para o bloco e seus nós filhos; algumas configurações que dependem de UIDs podem precisar ser reconfiguradas.

## Modelo de Campo

Os modelos de campo são usados para reutilizar configurações da área de campos (seleção de campos, layout e configurações de campos) em **blocos de formulário** e **blocos de detalhes**, evitando a adição repetitiva de campos em várias páginas ou blocos.

> Os modelos de campo afetam apenas a "área de campos" e não substituem o bloco inteiro. Para reutilizar um bloco inteiro, use o Modelo de Bloco descrito acima.

### Usar Modelos de Campo em Blocos de Formulário/Detalhes

1) Entre no modo de configuração e abra o menu "Campos" em um bloco de formulário ou detalhes.  
2) Selecione `Modelo de campo`.  
3) Escolha um modelo e selecione o modo: `Referência` ou `Cópia`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Aviso de Substituição

Quando já existem campos no bloco, o uso do modo **Referência** geralmente solicitará uma confirmação (pois os campos referenciados substituirão a área de campos atual).

### Converter Campos Referenciados em Cópia

Quando um bloco está referenciando um modelo de campo, você pode usar `Converter campos referenciados em cópia` no menu de configurações do bloco para tornar a área de campos atual uma configuração independente (desconectando a referência).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Observações

- Os modelos de campo aplicam-se apenas a **blocos de formulário** e **blocos de detalhes**.
- Quando o modelo e o bloco atual estão vinculados a tabelas de dados diferentes, o modelo aparecerá como indisponível no seletor, exibindo o motivo.
- Se você deseja fazer "ajustes personalizados" nos campos do bloco atual, recomenda-se usar o modo `Cópia` diretamente ou executar primeiro a "Conversão de campos referenciados em cópia".

## Modelo de Pop-up

Os modelos de pop-up são usados para reutilizar um conjunto de interfaces de pop-up e lógica de interação. Para configurações gerais, como método de abertura e tamanho do pop-up, consulte [Editar pop-up](/interface-builder/actions/action-settings/edit-popup).

### Salvar Pop-up como Modelo

1) Abra o menu de configurações de um botão ou campo que possa acionar um pop-up e clique em `Salvar como modelo`.  
2) Preencha o nome/descrição do modelo e escolha o modo de salvamento:
   - **Converter o pop-up atual em modelo**: Após salvar, o pop-up atual mudará para referenciar esse modelo.
   - **Copiar o pop-up atual como modelo**: Apenas cria o modelo; o pop-up atual permanece inalterado.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Usar Modelo na Configuração do Pop-up

1) Abra a configuração de pop-up do botão ou campo.  
2) Selecione um modelo em `Modelo de pop-up` para reutilizá-lo.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Condições de Uso (Alcance de Disponibilidade do Modelo)

Os modelos de pop-up estão relacionados ao cenário da ação que aciona o pop-up. O seletor filtrará ou desativará automaticamente modelos incompatíveis com base no cenário atual (exibindo os motivos quando as condições não forem atendidas).

| Tipo de Ação Atual | Modelos de Pop-up Disponíveis |
| --- | --- |
| **Ação de coleção** | Modelos de pop-up criados por ações de coleção da mesma coleção |
| **Ação de registro sem associação** | Modelos de pop-up criados por ações de coleção ou ações de registro sem associação da mesma coleção |
| **Ação de registro de associação** | Modelos de pop-up criados por ações de coleção ou ações de registro sem associação da mesma coleção; ou modelos de pop-up criados por ações de registro de associação do mesmo campo de associação |

### Pop-ups de Dados de Relacionamento

Pop-ups acionados por dados de relacionamento (campos de associação) possuem regras de correspondência específicas:

#### Correspondência Estrita para Modelos de Pop-up de Associação

Quando um modelo de pop-up é criado a partir de uma **ação de registro de associação** (o modelo possui um `associationName`), esse modelo só pode ser usado por ações ou campos com o **exato mesmo campo de associação**.

Por exemplo: um modelo de pop-up criado no campo de associação `Pedido.Cliente` só pode ser usado por outras ações do campo de associação `Pedido.Cliente`. Ele não pode ser usado pelo campo de associação `Pedido.Indicador` (mesmo que ambos tenham como alvo a mesma tabela de dados `Cliente`).

Isso ocorre porque as variáveis internas e as configurações dos modelos de pop-up de associação dependem do contexto específico do relacionamento de associação.

#### Ações de Associação Reutilizando Modelos da Tabela de Dados de Destino

Campos ou ações de associação podem reutilizar **modelos de pop-up sem associação da tabela de dados de destino** (modelos criados por ações de coleção ou ações de registro sem associação), desde que a tabela de dados coincida.

Por exemplo: o campo de associação `Pedido.Cliente` pode usar modelos de pop-up da tabela de dados `Cliente`. Esta abordagem é adequada para compartilhar a mesma configuração de pop-up entre vários campos de associação (como um pop-up unificado de detalhes do cliente).

### Converter Referência em Cópia

Quando um pop-up está referenciando um modelo, você pode usar `Converter referência em cópia` no menu de configurações para tornar o pop-up atual uma configuração independente (desconectando a referência).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Gerenciamento de Modelos

Em Configurações do sistema → `Modelos de UI`, você pode visualizar e gerenciar todos os modelos:

- **Modelos de bloco (v2)**: Gerenciar modelos de bloco.
- **Modelos de pop-up (v2)**: Gerenciar modelos de pop-up.

> Os modelos de campo originam-se de modelos de bloco e são gerenciados dentro deles.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Operações suportadas: Visualizar, Filtrar, Editar, Excluir.

> **Nota**: Se um modelo estiver sendo referenciado, ele não poderá ser excluído diretamente. Primeiro, use `Converter referência em cópia` nos locais que referenciam esse modelo para desconectar a referência e, em seguida, exclua o modelo.