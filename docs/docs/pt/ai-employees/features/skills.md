---
pkg: '@nocobase/plugin-ai'
title: 'Funcionários de IA Usando Skills'
description: 'Skills são guias de conhecimento de áreas especializadas para Funcionários de IA: General skills, Employee-specific skills.'
keywords: 'Habilidades de Funcionário de IA,Skills,NocoBase'
---

# Usar Skills

Skills são guias de conhecimento de áreas especializadas fornecidos aos Funcionários de IA, orientando-os a usar várias ferramentas para lidar com tarefas em domínios profissionais.

Atualmente, Skills não suportam personalização e são fornecidos apenas como predefinições do sistema.

## Estrutura de Skills

A página de Skills é dividida em duas categorias:

1. `General skills`: compartilhados por todos os Funcionários de IA, geralmente somente leitura.
2. `Employee-specific skills`: exclusivos do funcionário atual.

![](https://static-docs.nocobase.com/202604230832639.png)

## Apresentação dos Skills

### Skills Gerais

| Nome do Skill            | Descrição da Função                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Data metadata            | Obtém o modelo de dados do sistema, metadados de coleções, campos, etc., ajudando o Funcionário de IA a entender o contexto de negócio. |
| Data query               | Consulta dados em coleções, com suporte a filtros condicionais, consultas agregadas, etc., ajudando o Funcionário de IA a obter dados de negócio. |
| Business analysis report | Gera relatórios de análise com base em dados de negócio, com suporte a análises multidimensionais e visualizações, ajudando o Funcionário de IA a obter insights de negócio. |
| Document search          | Pesquisa e lê o conteúdo de documentos predefinidos, ajudando o Funcionário de IA a realizar trabalhos baseados em documentos, atualmente focado principalmente em escrever código JS. |

### Skills Exclusivos

| Nome do Skill      | Descrição da Função                                  | Funcionário Proprietário |
| ------------------ | ---------------------------------------------------- | ------------------------ |
| Data modeling      | Skill de modelagem de dados, entender e construir modelos de dados de negócio | Orin                     |
| Frontend developer | Escrever e testar código JS de blocos de frontend    | Nathan                   |
