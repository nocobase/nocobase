---
title: "Texto de uma linha"
description: "O campo de texto de uma linha é usado para armazenar nomes, números, títulos, contatos e outros conteúdos de texto curtos. Por padrão, usa o tipo string e o campo de entrada Input."
keywords: "Texto de uma linha,input,campo de texto,string,Field interface,NocoBase"
---

# Texto de uma linha

## Introdução

No NocoBase, **texto de uma linha (Single line text)** é o campo de texto mais utilizado. Ele é adequado para armazenar conteúdos de texto curtos, com no máximo uma linha, como nome do cliente, número do pedido, contato, resumo do endereço e identificador de sistemas externos.

Por padrão, o campo de texto de uma linha usa o campo de entrada `Input`, e o Field type padrão é `string`. Ele pode ser usado como campo de título e também participar de filtros, ordenação, permissões, condições de fluxo de trabalho e consultas de API.

Se o conteúdo puder precisar de quebras de linha ou for mais extenso, é mais adequado escolher [texto de várias linhas](./textarea.md). Se o conteúdo tiver um formato fixo, como e-mail, número de celular ou URL, dê preferência ao campo especializado correspondente.

## Cenários aplicáveis

O texto de uma linha é adequado para estes cenários de negócio:

- Nome do cliente, nome da empresa e nome do contato
- Número do pedido, número do contrato e número do projeto
- Título da tarefa, título do chamado e título do artigo
- ID de sistema externo, número de sincronização e código de negócio
- Cidade, resumo do endereço, nome da loja e outras informações de texto curto

## Configuração de criação

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Single line text» para criar um campo de texto de uma linha.

![20240512163555](https://static-docs.nocobase.com/20240512163555.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. O texto de uma linha corresponde a `input` e, por padrão, usa um campo de entrada para inserir e exibir os dados na página. |
| Field display name | Nome exibido do campo na interface, como «Nome do cliente», «Número do pedido» ou «Título da tarefa». Recomenda-se usar um nome que os usuários de negócio compreendam diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em API, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhado, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. O texto de uma linha usa `string` por padrão, mas também pode usar `uid`. Para textos curtos comuns, `string` normalmente é suficiente. |
| Automatically remove heading and tailing spaces | Remove automaticamente os espaços no início e no fim. É adequado para conteúdos como nomes de clientes, números e títulos, nos quais esses espaços não devem ser preservados. |
| Default value | Valor padrão. Ao adicionar um registro, um texto padrão pode ser preenchido automaticamente se o usuário não inserir um valor. |
| Primary | Define o campo como chave primária. Disponível apenas ao criar campos no banco de dados principal; não é recomendado usar textos comuns de negócio como chave primária. |
| Unique | Restrição de unicidade. É adequada para textos que não podem se repetir, como números de pedidos, números de contratos e IDs de sistemas externos. |
| Validation rules | Regras de validação. Podem limitar o comprimento mínimo, o comprimento máximo, o comprimento fixo ou uma expressão regular. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de texto de uma linha é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `input`. |
| Field type padrão | `string`. |
| Field type disponível | `string`, `uid`. |
| Componente da página | No modo de edição, usa o campo de entrada `Input`. |
| Campo de título | Pode ser usado como campo de título da tabela de dados. É adequado definir «Nome do cliente», «Número do pedido» ou «Título da tarefa» como campo de título. |
| Ordenação | Permite ordenar em blocos de tabela. |
| Filtragem | Permite filtros de texto, como contém, não contém, igual a, diferente de, vazio e não vazio. |
| Validação | Permite validações como comprimento mínimo, comprimento máximo, comprimento fixo e expressão regular. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de texto de uma linha. A edição do campo é usada principalmente para ajustar sua exibição e utilização no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou a remoção automática de espaços no início e no fim.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente envolve o mapeamento do campo: mapear o campo do banco de dados para o Field type e o Field interface do NocoBase. Por exemplo, colunas de texto curto como `varchar` e `char` no banco de dados podem ser mapeadas para campos de texto de uma linha.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. O ajuste afeta a forma de entrada, exibição e validação na página. |
| Field type | Suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Automatically remove heading and tailing spaces | Sim | Controla se os espaços no início e no fim serão removidos ao salvar. |
| Default value | Sim | Ajusta o texto padrão de novos registros. |
| Unique | Suporte condicional | Pode ser configurado para campos novos do banco de dados principal. Se já existirem valores duplicados, a adição de uma restrição de unicidade poderá falhar. |
| Validation rules | Sim | Ajusta as validações de comprimento, formato ou expressão regular. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alterar o Field type ou o Field interface não equivale simplesmente a mudar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de utilização das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de texto de uma linha. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de texto de uma linha criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nela também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de texto de uma linha pode ser usado na maioria dos cenários de blocos de dados e formulários.

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Inserir ou editar conteúdos de texto curto, como nome do cliente, número do pedido e título da tarefa. |
| Bloco de tabela | Exibir, ordenar e filtrar conteúdos de texto curto. Quando o conteúdo for extenso, ele será truncado na tabela de acordo com a configuração da interface. |
| Bloco de detalhes | Exibir informações de texto de um único registro. |
| Bloco de filtragem | Usar como condição de consulta para filtrar registros, por exemplo, por nome do cliente, número ou título. |
| Exibição de campos de relação | Quando o campo de texto de uma linha é definido como campo de título, esse texto é exibido prioritariamente ao selecionar um registro em um campo de relação. |
| Fluxos de trabalho e permissões | Participar de avaliações como campo de condição, por exemplo, para verificar se o número do pedido está vazio ou se o nome do cliente contém determinada palavra-chave. |

### Modo editável

No modo editável, o campo de texto de uma linha usa um campo de entrada para inserir o conteúdo.

![20240512164001](https://static-docs.nocobase.com/20240512164001.png)

### Modo de leitura

No modo de leitura, o campo de texto de uma linha é exibido como texto comum.

![20240512164138](https://static-docs.nocobase.com/20240512164138.png)