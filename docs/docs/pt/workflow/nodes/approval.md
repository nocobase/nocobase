---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Aprovação

## Introdução

Em um fluxo de trabalho de aprovação, é necessário usar um nó "Aprovação" dedicado para configurar a lógica de operação para que os aprovadores processem (aprovem, rejeitem ou retornem) a aprovação iniciada. O nó "Aprovação" só pode ser usado em processos de aprovação.

:::info{title=Dica}
Diferença do nó "Processamento Manual" comum: O nó "Processamento Manual" comum é voltado para cenários mais generalizados, podendo ser usado para entrada manual de dados, decisões manuais sobre a continuidade do processo, entre outros, em diversos tipos de fluxos de trabalho. O "Nó de Aprovação" é um nó de processamento especializado, dedicado exclusivamente a processos de aprovação, lidando apenas com os dados da aprovação iniciada e não podendo ser usado em outros fluxos de trabalho.
:::

## Criar Nó

Clique no botão de adição ("+") no fluxo, adicione um nó "Aprovação" e, em seguida, selecione um dos modos de aprovação para criar o nó:

![审批节点_创建](https://static-docs.nocobase.com/20251107000938.png)

## Configuração do Nó

### Modo de Aprovação

Existem dois modos de aprovação:

1.  **Modo Direto**: Geralmente usado para fluxos mais simples. A aprovação ou não do nó de aprovação apenas determina se o fluxo termina. Em caso de não aprovação, o fluxo é encerrado diretamente.

    ![审批节点_通过模式_直通模式](https://static-docs.nocobase.com/20251107001043.png)

2.  **Modo de Ramificação**: Geralmente usado para lógicas de dados mais complexas. Após o nó de aprovação produzir qualquer resultado, outros nós podem continuar a ser executados dentro de sua ramificação de resultado.

    ![审批节点_通过模式_分支模式](https://static-docs.nocobase.com/20251107001234.png)

    Após este nó ser "Aprovado", além de executar a ramificação de aprovação, o fluxo subsequente também continuará. Após uma ação de "Rejeitar", o fluxo subsequente também pode continuar por padrão, ou você pode configurar o nó para encerrar o fluxo após a execução da ramificação.

:::info{title=Dica}
O modo de aprovação não pode ser modificado após a criação do nó.
:::

### Aprovador

O aprovador é o conjunto de usuários responsáveis pela ação de aprovação deste nó. Pode ser um ou mais usuários. A origem da seleção pode ser um valor estático escolhido de uma lista de usuários, ou um valor dinâmico especificado por uma variável:

![审批节点_审批人](https://static-docs.nocobase.com/20251107001433.png)

Ao selecionar uma variável, você só pode escolher a chave primária ou chave estrangeira dos dados do usuário a partir do contexto e dos resultados do nó. Se a variável selecionada for um array durante a execução (para relacionamentos de muitos para muitos), cada usuário no array será mesclado no conjunto completo de aprovadores.

Além de selecionar diretamente usuários ou variáveis, você também pode filtrar dinamicamente usuários que atendem a determinadas condições, com base em critérios de consulta da tabela de usuários, para serem os aprovadores:

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Modo de Acordo

Se houver apenas um aprovador na execução final (incluindo casos após a desduplicação de múltiplas variáveis), independentemente do modo de acordo selecionado, apenas esse usuário executará a ação de aprovação, e o resultado será determinado exclusivamente por ele.

Quando há vários usuários no conjunto de aprovadores, a seleção de diferentes modos de acordo representa diferentes formas de processamento:

1.  **Qualquer um**: Basta que uma pessoa aprove para que o nó seja aprovado. O nó é rejeitado apenas se todos rejeitarem.
2.  **Todos**: É necessário que todos aprovem para que o nó seja aprovado. Basta que uma pessoa rejeite para que o nó seja rejeitado.
3.  **Votação**: É necessário que o número de pessoas que aprovam exceda uma proporção definida para que o nó seja aprovado; caso contrário, o nó é rejeitado.

Para a ação de retorno, em qualquer modo, se algum usuário no conjunto de aprovadores processar como retorno, o nó sairá diretamente do fluxo.

### Ordem de Processamento

Da mesma forma, quando há vários usuários no conjunto de aprovadores, a seleção de diferentes ordens de processamento representa diferentes formas de processamento:

1.  **Paralelo**: Todos os aprovadores podem processar em qualquer ordem; a sequência de processamento não importa.
2.  **Sequencial**: Os aprovadores processam sequencialmente de acordo com a ordem no conjunto de aprovadores. O próximo aprovador só pode processar depois que o anterior tiver enviado.

Independentemente de ser configurado para processamento "Sequencial", o resultado produzido de acordo com a ordem real de processamento também seguirá as regras do "Modo de Acordo" mencionado acima. O nó conclui sua execução assim que as condições correspondentes são atendidas.

### Sair do fluxo de trabalho após o término da ramificação de rejeição

Quando o "Modo de Aprovação" é definido como "Modo de Ramificação", você pode escolher sair do fluxo de trabalho após o término da ramificação de rejeição. Após marcar esta opção, um "✗" será exibido no final da ramificação de rejeição, indicando que os nós subsequentes não continuarão após o término desta ramificação:

![审批节点_拒绝后退出](https://static-docs.nocobase.com/20251107001839.png)

### Configuração da Interface do Aprovador

A configuração da interface do aprovador é usada para fornecer uma interface de operação para o aprovador quando o fluxo de trabalho de aprovação executa este nó. Clique no botão de configuração para abrir a janela pop-up:

![审批节点_界面配置_弹窗](https://static-docs.nocobase.com/20251107001958.png)

Na janela pop-up de configuração, você pode adicionar blocos como conteúdo de envio original, informações de aprovação, formulário de processamento e texto de dica personalizado:

![审批节点_界面配置_添加区块](https://static-docs.nocobase.com/20251107002604.png)

#### Conteúdo Original da Submissão

O bloco de detalhes do conteúdo de aprovação é o bloco de dados enviado pelo iniciador. Semelhante a um bloco de dados comum, você pode adicionar livremente componentes de campo da coleção e organizá-los como desejar, para estruturar o conteúdo que o aprovador precisa visualizar:

![审批节点_界面配置_详情区块](https://static-docs.nocobase.com/20251107002925.png)

#### Formulário de Processamento

No bloco do formulário de ação, você pode adicionar botões de ação suportados por este nó, incluindo "Aprovar", "Rejeitar", "Retornar", "Reatribuir" e "Adicionar Aprovador":

![审批节点_界面配置_操作表单区块](https://static-docs.nocobase.com/20251107003015.png)

Além disso, campos que podem ser modificados pelo aprovador também podem ser adicionados ao formulário de ação. Esses campos serão exibidos no formulário de ação quando o aprovador estiver processando a aprovação. O aprovador pode modificar os valores desses campos e, após o envio, tanto os dados para aprovação quanto o instantâneo dos dados correspondentes no fluxo de trabalho de aprovação serão atualizados simultaneamente.

![审批节点_界面配置_操作表表_修改审批内容字段](https://static-docs.nocobase.com/20251107003206.png)

#### "Aprovar" e "Rejeitar"

Entre os botões de ação de aprovação, "Aprovar" e "Rejeitar" são ações decisivas. Após o envio, o processamento do aprovador para este nó é concluído. Campos adicionais que precisam ser preenchidos no momento do envio, como "Comentário", podem ser adicionados na janela pop-up de "Configuração de Processamento" do botão de ação.

![审批节点_界面配置_操作表单_处理配置](https://static-docs.nocobase.com/20251107003314.png)

#### "Retornar"

"Retornar" também é uma ação decisiva. Além de poder configurar comentários, você também pode configurar os nós para os quais o retorno é permitido:

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### "Reatribuir" e "Adicionar Aprovador"

"Reatribuir" e "Adicionar Aprovador" são ações não decisivas usadas para ajustar dinamicamente os aprovadores no fluxo de trabalho de aprovação. "Reatribuir" é passar a tarefa de aprovação do usuário atual para outro usuário processar. "Adicionar Aprovador" é incluir um aprovador antes ou depois do aprovador atual, e o novo aprovador continuará a aprovação em conjunto.

Após habilitar os botões de ação "Reatribuir" ou "Adicionar Aprovador", é necessário selecionar o "Escopo de Atribuição de Pessoal" no menu de configuração do botão para definir o alcance dos usuários que podem ser designados como novos aprovadores:

![审批节点_界面配置_操作表单_指派人员范围](https://static-docs.nocobase.com/20241226232321.png)

Assim como na configuração original de aprovadores do nó, o escopo de atribuição de pessoal também pode ser aprovadores selecionados diretamente ou baseado em condições de consulta da coleção de usuários. Ele será eventualmente mesclado em um conjunto e não incluirá usuários que já estão no conjunto de aprovadores.

:::warning{title=Importante}
Se um botão de ação for habilitado ou desabilitado, ou se o escopo de atribuição de pessoal for modificado, você deve salvar a configuração do nó após fechar a janela pop-up de configuração da interface de ação. Caso contrário, as alterações no botão de ação não terão efeito.
:::

## Resultado do Nó

Após a conclusão da aprovação, o status e os dados relevantes serão registrados no resultado do nó e poderão ser usados como variáveis por nós subsequentes.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Status de Aprovação do Nó

Representa o status de processamento do nó de aprovação atual. O resultado é um valor enumerado.

### Dados Após Aprovação

Se o aprovador modificar o conteúdo da aprovação no formulário de ação, os dados modificados serão registrados no resultado do nó para uso por nós subsequentes. Para usar campos de relacionamento, você precisa configurar o pré-carregamento para os campos de relacionamento no gatilho.

### Registros de Aprovação

> v1.8.0+

O registro de processamento de aprovação é um array que contém os registros de processamento de todos os aprovadores neste nó. Cada registro de processamento inclui os seguintes campos:

| Campo     | Tipo   | Descrição                                  |
| --------- | ------ | ------------------------------------------ |
| id        | number | Identificador único do registro de processo |
| userId    | number | ID do usuário que processou este registro  |
| status    | number | Status do processamento                    |
| comment   | string | Comentário no momento do processamento     |
| updatedAt | string | Hora da atualização do registro de processo |

Você pode usar esses campos como variáveis em nós subsequentes, conforme necessário.