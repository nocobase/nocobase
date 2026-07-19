---
title: "Cor"
description: "O campo de cor é usado para armazenar valores de cor, sendo adequado para status, categorias, etiquetas e configurações de exibição."
keywords: "cor,color,campo,NocoBase"
---

# Cor

## Introdução

No NocoBase, **cor (Color)** é usada para armazenar valores de cor.

O campo de cor é adequado para armazenar cores de categorias, etiquetas, status, gráficos ou configurações de exibição. Normalmente, ele armazena valores de cor hexadecimais ou formatos de cor compatíveis com o componente.

Se a cor for apenas parte de um campo de opções, é possível configurá-la diretamente no campo de opções, sem necessariamente criar um campo de cor separado.

## Cenários aplicáveis

O campo de cor é adequado para estes cenários de negócio:

- Cores de níveis de clientes e de status
- Cores de etiquetas e categorias
- Cores de séries de gráficos
- Configurações de exibição de páginas ou cartões

## Criar configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Cor» para criar um campo de cor.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para cores, corresponde a `color` e determina como o valor será inserido e exibido na página. |
| Field display name | Nome exibido para o campo na interface, como «Cor do status», «Cor da etiqueta» ou «Cor do gráfico». Recomenda-se usar um nome que os usuários de negócio consigam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho etc. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de cor é `string`. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser preenchido automaticamente. |
| Validation rules | Regras de validação. Normalmente, basta configurar o campo como obrigatório. |
| Description | Descrição do campo. É adequado incluir o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de cor é o seguinte:

| Característica | Descrição |
| --- | --- |
| Interface Field interface padrão | `color`. |
| Field type padrão | `string`. |
| Field type opcional | `string`. |
| Componente da página | O modo de edição usa um componente de seleção de cores. |
| Filtro | É possível filtrar por valor de cor, embora normalmente não seja uma condição de consulta principal. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações básicas, como preenchimento obrigatório. |

## Editar configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de cor. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, como alterar o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar seu nome identificador. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Sujeito a condições | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes poderão ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão para novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale simplesmente a alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtro e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Excluir campo

Clique em «Delete» à direita do campo para excluir o campo de cor. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo de cor criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nessa coluna também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração de páginas

O campo de cor é adequado para uso em cenários de exibição e configuração de páginas.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Selecionar um valor de cor. |
| Bloco de detalhes | Exibir a cor. |
| Lista ou cartão | Servir como identificação visual de status, etiquetas ou categorias. |
| Gráfico | Servir como fonte de configuração de cores. |

## Links relacionados

- [Campo](../index.md) — Entenda a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em tabelas comuns
- [Ícone](./icon.md) — Armazene identificadores de ícones
- [Seleção única em lista suspensa](../choices/select.md) — Configure cores diretamente nas opções
