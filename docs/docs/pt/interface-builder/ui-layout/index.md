---
title: "Layout da interface"
description: "Visão geral dos layouts da interface do NocoBase, com as características, os casos de uso e a relação entre os layouts para desktop e dispositivos móveis."
keywords: "layout da interface,layout para desktop,layout móvel,layout responsivo,páginas móveis,NocoBase"
---

# Layout da interface

O NocoBase oferece layouts para desktop e dispositivos móveis. Nos dois layouts, você pode usar o Construtor de Interface para criar páginas e configurar blocos, campos e ações.

O layout para desktop é a opção padrão e atende às tarefas diárias de administração e tratamento de dados no computador. Se você precisar de navegação e páginas independentes para dispositivos móveis, poderá configurar também o layout móvel.

## Layout para desktop

O [layout para desktop](./desktop.md) é acessado por padrão em `/admin`. Ele é composto por navegação superior, navegação lateral e área de conteúdo, e atende a cenários comuns, como gerenciamento de tabelas, preenchimento de formulários e consulta de dados.

O layout para desktop também é responsivo em telas estreitas. Quando a página é exibida em uma tela menor, a navegação, os espaçamentos e os componentes mais usados assumem uma forma mais adequada ao espaço disponível, sem deixar de usar os menus e as páginas originais do desktop.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

## Layout para dispositivos móveis

O [layout para dispositivos móveis](./mobile.md) é acessado por padrão em `/mobile`. Ele usa uma barra de abas inferior para organizar a navegação principal e oferece páginas, links e abas de página configurados de forma independente.

Esse layout atende a cenários com uso frequente no celular, como registros em campo, aprovações, tratamento de tarefas e consultas de dados. Você pode construir e visualizar as páginas no navegador do computador e depois conferir o resultado em um aparelho usando o código QR.

![20260715230725](https://static-docs.nocobase.com/20260715230725.png)

## Como escolher

Por padrão, use o layout para desktop.

| Quero... | Layout recomendado |
| --- | --- |
| Trabalhar principalmente no computador e acessar ocasionalmente pelo celular | [Layout para desktop](./desktop.md) |
| Criar navegação, páginas e fluxos de operação próprios para celulares | [Layout para dispositivos móveis](./mobile.md) |
| Oferecer uma experiência completa no computador e no celular | Configure separadamente os layouts para desktop e dispositivos móveis |

## Relação entre as configurações

Os layouts para desktop e dispositivos móveis usam as mesmas fontes de dados e os mesmos dados de negócio. Assim, você pode criar em cada layout páginas diferentes com base na mesma tabela de dados, ajustadas ao dispositivo em que serão usadas.

Menus, rotas e páginas são mantidos separadamente. Alterar uma página do desktop não atualiza automaticamente a página móvel, e alterações na navegação móvel não afetam a navegação do desktop. As [permissões de acesso às rotas](../../users-permissions/acl/permissions.md) também precisam ser configuradas separadamente nos dois layouts.

## Links relacionados

- [Layout para desktop](./desktop.md) — construa páginas para desktop e conheça o comportamento responsivo em telas estreitas
- [Layout para dispositivos móveis](./mobile.md) — construa navegação e páginas independentes para dispositivos móveis
- [Gerenciador de Rotas](../../routes/index.md) — gerencie páginas, links e menus dos layouts para desktop e dispositivos móveis
- [Configuração de permissões](../../users-permissions/acl/permissions.md) — configure os menus e as páginas que cada função pode acessar
