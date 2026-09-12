---
title: "Campo de relação"
description: "Os campos de relação são usados para estabelecer associações entre tabelas de dados, oferecendo suporte a relações um para um, um para muitos, muitos para um, muitos para muitos e muitos para muitos com arrays."
keywords: "Campo de relação,BelongsTo,HasMany,O2O,O2M,M2O,M2M,Campo associado,NocoBase"
---

# Campo de relação

No NocoBase, os **campos de relação** são usados para estabelecer associações entre diferentes tabelas de dados. Eles permitem que um registro faça referência a um registro de outra tabela ou a vários registros, como um pedido associado a um cliente, uma tarefa associada a um responsável ou um aluno associado a um curso.

Os campos de relação não são exatamente iguais aos campos comuns. Em geral, os campos comuns correspondem a colunas reais no banco de dados e armazenam valores como texto, números e datas; os campos de relação armazenam a configuração da conexão entre tabelas e as chaves usadas para localizar os registros relacionados. No banco de dados principal, os campos de relação podem gerar a configuração de relação necessária durante a criação do campo; em bancos de dados externos, as relações normalmente são estabelecidas com base em chaves primárias, chaves estrangeiras ou campos exclusivos existentes, sem modificar automaticamente a estrutura das tabelas externas.

## Escolher o tipo de relação

Os tipos de relação mais comuns são:

| Tipo de relação | Cenário de uso |
| --- | --- |
| [Um para um](./o2o/index.md) | Um registro está associado a apenas um registro de outra tabela. Por exemplo, um funcionário está associado a um único cadastro de admissão. |
| [Um para muitos](./o2m/index.md) | Um registro está associado a vários registros de outra tabela. Por exemplo, um cliente está associado a vários pedidos. |
| [Muitos para um](./m2o/index.md) | Vários registros estão associados ao mesmo registro de destino. Por exemplo, vários pedidos estão associados ao mesmo cliente. |
| [Muitos para muitos](./m2m/index.md) | Duas tabelas podem estar associadas a vários registros entre si. Por exemplo, alunos e cursos estão associados uns aos outros. |
| [Muitos para muitos (array)](../../../field-m2m-array/index.md) | Usa um campo de array para armazenar os identificadores de vários registros de destino, sendo adequado para cenários em que os valores de relação já são armazenados como arrays na estrutura existente da tabela. |

Por padrão, determine primeiro a relação com base no significado do negócio: se o registro atual pertence a apenas um registro de destino, normalmente use muitos para um; se o registro atual precisa visualizar vários registros da tabela de destino, normalmente use um para muitos; se ambos os lados podem estar associados a vários registros, use muitos para muitos.

## Pontos principais da configuração

Ao configurar um campo de relação, confirme principalmente estas informações:

- Tabela de dados de destino: a tabela à qual a relação será associada
- Tipo de relação: um para um, um para muitos, muitos para um, muitos para muitos ou muitos para muitos com array
- Chaves de relação: os campos usados para localizar os registros dos dois lados, normalmente uma chave primária, chave estrangeira ou campo exclusivo
- Campo de título: o campo que será exibido por padrão para o registro associado nos seletores e blocos

:::warning Atenção

Nos bancos de dados externos, os campos de relação são principalmente metadados de relação salvos pelo NocoBase. A adição de um campo de relação não cria automaticamente chaves estrangeiras, índices ou tabelas intermediárias reais no banco de dados externo. Se forem necessárias restrições de chave estrangeira no nível do banco de dados, configure-as primeiro no banco de dados e depois volte ao NocoBase para sincronizar e configurar o campo.

:::

## Links relacionados

- [Um para um](./o2o/index.md) — Consulte a configuração do campo de relação um para um
- [Um para muitos](./o2m/index.md) — Consulte a configuração do campo de relação um para muitos
- [Muitos para um](./m2o/index.md) — Consulte a configuração do campo de relação muitos para um
- [Muitos para muitos](./m2m/index.md) — Consulte a configuração do campo de relação muitos para muitos
- [Muitos para muitos (array)](../../../field-m2m-array/index.md) — Consulte a relação muitos para muitos baseada em array