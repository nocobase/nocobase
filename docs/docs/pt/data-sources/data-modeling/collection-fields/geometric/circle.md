---
title: "Círculo"
description: "O campo de círculo é usado para armazenar uma área representada por um ponto central e um raio."
keywords: "Círculo,Circle,figura geométrica,mapa,NocoBase"
---

# Círculo

## Introdução

No NocoBase, **círculo (Circle)** é usado para armazenar áreas circulares.

O campo de círculo é adequado para dados como raio de atendimento, área de entrega e área de cobertura de lojas.

Se a área não for circular, escolha o [polígono](./polygon.md). Se precisar apenas da localização central, escolha o [ponto](./point.md).

## Cenários de uso

O círculo é adequado para estes cenários:

- Raio de atendimento da loja
- Área de cobertura de entregas
- Área de influência de dispositivos
- Área de busca ao redor de um ponto

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Círculo» para criar um campo de círculo.

![20240512181522](https://static-docs.nocobase.com/20240512181522.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. Para círculos, corresponde a `circle` e determina como os dados são inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Raio de atendimento», «Área de cobertura» ou «Área de influência». Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome de identificação do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados, e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. Por padrão, o campo de círculo é `circle`. |
| Default value | Valor padrão. Ao criar um registro, se o usuário não preencher o campo, o valor padrão poderá ser inserido automaticamente. |
| Validation rules | Regras de validação. Normalmente, basta configurar o campo como obrigatório. |
| Description | Descrição do campo. É adequada para registrar o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajuste de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo de círculo é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `circle`. |
| Field type padrão | `circle`. |
| Field type opcional | `circle`. |
| Componente da página | No modo de edição, usa um componente de mapa para desenhar. |
| Filtragem | A capacidade de filtragem espacial depende do plug-in de mapas e dos recursos da fonte de dados. |
| Ordenação | Normalmente não é usado para ordenação. |
| Validação | Oferece suporte a validações básicas, como obrigatoriedade. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo de círculo. A edição do campo serve principalmente para ajustar como ele é exibido e usado no NocoBase, por exemplo, alterando o nome exibido, a descrição, o valor padrão, as regras de validação ou as configurações específicas do campo.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em um mapeamento de campo — mapeando o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface sem alterar seu nome de identificação. |
| Field name | Não | Normalmente, o nome de identificação do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afeta a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, é necessário confirmar se os dados existentes podem ser usados com o novo tipo. |
| Default value | Sim | Ajusta o valor padrão dos novos registros. |
| Validation rules | Sim | Ajusta as regras de validação do campo. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a origem dos dados ou o responsável pela manutenção. |

:::warning Atenção

Alternar o Field type ou o Field interface não equivale a simplesmente alterar um nome exibido. Isso afeta a forma de armazenamento do campo, o componente de entrada, as regras de validação, as condições de filtragem e a forma de uso das variáveis em fluxos de trabalho. Quando houver muitos dados existentes, confirme primeiro se o formato dos dados é compatível.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo de círculo. No banco de dados principal, também é possível selecionar vários campos e excluí-los em massa.

Ao excluir um campo de círculo criado no banco de dados principal, normalmente a coluna real correspondente no banco de dados e os dados já existentes nela também são excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto depende da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão de um campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações e exportações, além dos dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por alguma configuração de negócio.

:::

## Uso na configuração de páginas

O campo de círculo é adequado para cenários de áreas de atendimento e cobertura.
![20260710145031](https://static-docs.nocobase.com/20260710145031.png)

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Desenhar uma área circular. |
| Bloco de detalhes | Exibir uma área circular. |
| Bloco de mapa | Exibir a área de cobertura no mapa. |
| Fluxo de trabalho | Participar do processo como dado relacionado a uma área. |

## Links relacionados

- [Campo](../index.md) — saiba mais sobre a função, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — crie e gerencie campos em uma tabela comum
- [Ponto](./point.md) — armazene uma localização central
- [Polígono](./polygon.md) — armazene uma área não circular