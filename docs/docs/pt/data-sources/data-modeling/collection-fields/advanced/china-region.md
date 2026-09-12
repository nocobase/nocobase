---
title: "Região administrativa da China"
description: "O campo Região administrativa da China é usado para armazenar informações sobre divisões administrativas, como província, cidade e distrito/condado, com suporte à seleção em cascata de três níveis e à exibição hierárquica."
keywords: "Região administrativa da China, província-cidade-distrito, campo de divisão administrativa, seleção em cascata de três níveis,NocoBase"
---

# Região administrativa da China

<PluginInfo name="field-china-region"></PluginInfo>

## Introdução

No NocoBase, **Região administrativa da China (China region)** é usada para armazenar informações sobre divisões administrativas chinesas, como província, cidade e distrito/condado.

O campo Região administrativa da China é baseado na tabela integrada de dados de divisões administrativas `chinaRegions` e usa um seletor em cascata para inserir dados na página. Os usuários podem selecionar sucessivamente a província, a cidade e o distrito por nível; na exibição, os níveis são concatenados em um caminho completo.

Para armazenar endereços detalhados, como rua e número do imóvel, o campo pode ser usado em conjunto com os campos [Texto de linha única](../basic/input.md) ou [Texto multilinha](../basic/textarea.md).

## Cenários de aplicação

A Região administrativa da China é adequada para estes cenários de negócio:

- Localização de clientes, contatos, lojas e projetos
- Informações básicas de endereço, como domicílio registrado, naturalidade e região de entrega
- Áreas de atendimento, regiões de vendas e regiões de implementação de projetos
- Dados que precisam ser filtrados ou agrupados por província, cidade e distrito

## Criação e configuração

Na página «Configure fields» da tabela de dados, clique em «Add field» e selecione «Região administrativa da China» para criar um campo Região administrativa da China.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Configuração | Descrição |
| --- | --- |
| Field interface | Tipo de interface do campo. A Região administrativa da China corresponde a `chinaRegion`, que determina como os dados serão inseridos e exibidos na página. |
| Field display name | Nome exibido do campo na interface, como «Região de residência», «Área de atendimento» ou «Região de entrega». Recomenda-se usar um nome que os profissionais de negócio possam entender diretamente. |
| Field name | Nome identificador do campo, usado para referências internas em APIs, campos de relação, permissões, fluxos de trabalho e outros recursos. Normalmente não é alterado após a criação; aceita apenas letras, números e sublinhados e deve começar com uma letra. |
| Field type | Tipo do campo na camada de dados. A Região administrativa da China geralmente é armazenada como um registro relacionado ou um valor estruturado, conforme a configuração do campo. |
| Nível de seleção | Controla o nível mais profundo que pode ser selecionado. Atualmente, há suporte para «província», «cidade» e «distrito», sendo «distrito» o padrão. |
| É obrigatório selecionar até o último nível | Quando ativado, o usuário deve selecionar até o nível mais profundo configurado para poder enviar; quando desativado, é possível concluir a seleção em um nível intermediário. |
| Validation rules | Regras de validação. Normalmente, são configurados a obrigatoriedade e o nível de seleção. |
| Description | Descrição do campo. É adequada para indicar o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

O nome do campo será referenciado por blocos de página, permissões, fluxos de trabalho e APIs. Confirme a nomenclatura antes da criação para evitar custos de ajustes de configuração posteriormente.

:::

## Características do campo

O comportamento padrão do campo Região administrativa da China é o seguinte:

| Característica | Descrição |
| --- | --- |
| Field interface padrão | `chinaRegion`. |
| Fonte dos dados | Tabela integrada de dados de divisões administrativas `chinaRegions`. |
| Componente da página | O modo de edição usa um seletor em cascata. |
| Nível de seleção | Atualmente, há suporte para os três níveis: província, cidade e distrito. |
| Forma de exibição | No modo de leitura, os níveis são exibidos como `省 / 市 / 区`. |
| Filtragem | Permite filtrar pelos valores de região salvos; os recursos específicos dependem da configuração do campo e do bloco da página. |
| Seleção múltipla | A seleção múltipla não é compatível. |

## Edição da configuração

Após a criação, clique em «Edit» à direita do campo para editar a configuração do campo Região administrativa da China. A edição do campo é usada principalmente para ajustar a forma como ele é exibido e utilizado no NocoBase, por exemplo, para alterar o nome exibido, a descrição, as regras de validação, o nível de seleção ou a obrigatoriedade de selecionar até o último nível.

Se o campo vier de uma tabela já sincronizada no banco de dados principal, a edição normalmente consiste em fazer um mapeamento de campo — mapear o campo do banco de dados para o Field type e o Field interface do NocoBase.

| Configuração | Pode ser editada | Descrição |
| --- | --- | --- |
| Field display name | Sim | Altera o nome exibido do campo na interface, sem alterar o nome identificador do campo. |
| Field name | Não | Normalmente, o nome identificador do campo não pode ser alterado no formulário de edição após a criação. |
| Field interface | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. O ajuste afetará a forma de entrada, exibição e validação na página. |
| Field type | Com suporte condicional | Campos do banco de dados principal ou campos sincronizados podem ser ajustados durante o mapeamento de campos. Antes do ajuste, confirme se os dados existentes poderão ser usados com o novo tipo. |
| Nível de seleção | Sim | Ajusta se o campo pode selecionar até província, cidade ou distrito. |
| É obrigatório selecionar até o último nível | Sim | Controla se é obrigatório selecionar até o nível mais profundo configurado no momento do envio. |
| Validation rules | Sim | Ajusta regras de validação, como a obrigatoriedade. |
| Description | Sim | Complementa o significado do campo, os requisitos de preenchimento, a fonte dos dados ou o responsável pela manutenção. |

:::warning Atenção

O campo Região administrativa da China depende da tabela de dados `chinaRegions` fornecida pelo plug-in. Antes de usá-lo, verifique se o plug-in de campo «Divisões administrativas da China» está ativado.

:::

## Exclusão do campo

Clique em «Delete» à direita do campo para excluir o campo Região administrativa da China. No banco de dados principal, também é possível selecionar vários campos e excluí-los em lote.

Ao excluir um campo Região administrativa da China criado no banco de dados principal, normalmente a coluna correspondente no banco de dados e os dados já existentes nessa coluna também serão excluídos. Ao excluir um campo sincronizado do banco de dados ou mapeado de uma fonte de dados externa, o impacto dependerá da fonte de dados e da origem do campo correspondente.

:::danger Aviso

A exclusão do campo pode afetar blocos de página, formulários, filtros, permissões, fluxos de trabalho, APIs, importações, exportações e dados existentes. Antes de excluir, confirme se o campo ainda é referenciado por configurações de negócio.

:::

## Uso na configuração de páginas

O campo Região administrativa da China é adequado para cenários de endereço, região e estatísticas.

| Cenário | Uso |
| --- | --- |
| Bloco de formulário | Usar um seletor em cascata para selecionar província, cidade e distrito/condado. |
| Bloco de detalhes | Exibir o caminho da divisão administrativa. |
| Bloco de tabela | Exibir a região à qual o registro pertence. |
| Bloco de filtro | Filtrar registros por região. |
| Bloco de gráfico | Agrupar dados de negócio por província, cidade e distrito. |

### Modo de edição

No modo de edição, o campo Região administrativa da China é exibido como um seletor em cascata.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Modo de leitura

No modo de leitura, o campo Região administrativa da China será exibido como um caminho de texto, por exemplo:

```text
北京市 / 市辖区 / 东城区
```

## Links relacionados

- [Campo](../index.md) — Entenda a finalidade, a classificação e a lógica de mapeamento dos campos
- [Tabela comum](../../../data-source-main/general-collection.md) — Crie e gerencie campos em uma tabela comum
- [Texto de linha única](../basic/input.md) — Armazene endereços detalhados
- [Texto multilinha](../basic/textarea.md) — Armazene descrições de endereço mais longas