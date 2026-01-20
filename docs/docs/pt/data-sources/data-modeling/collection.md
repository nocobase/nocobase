:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral das Coleções

O NocoBase oferece uma DSL exclusiva para descrever a estrutura dos dados, conhecida como **coleção**. Ela unifica a estrutura de dados de diversas fontes, fornecendo uma base confiável para o gerenciamento, análise e aplicação de dados.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

Para facilitar o uso de diversos modelos de dados, você pode criar vários tipos de coleções:

- [Coleção Geral](/data-sources/data-source-main/general-collection): Inclui campos de sistema comuns integrados;
- [Coleção de Herança](/data-sources/data-source-main/inheritance-collection): Você pode criar uma coleção pai e, a partir dela, derivar uma coleção filha. A coleção filha herdará a estrutura da coleção pai e poderá definir suas próprias colunas.
- [Coleção em Árvore](/data-sources/collection-tree): Uma coleção com estrutura de árvore, que atualmente suporta apenas o design de lista de adjacência;
- [Coleção de Calendário](/data-sources/calendar/calendar-collection): Usada para criar coleções de eventos relacionados a calendários;
- [Coleção de Arquivos](/data-sources/file-manager/file-collection): Usada para o gerenciamento de armazenamento de arquivos;
- : Usada para cenários de expressão dinâmica em fluxos de trabalho;
- [Coleção SQL](/data-sources/collection-sql): Não é uma coleção de banco de dados real, mas apresenta rapidamente consultas SQL de forma estruturada;
- [Coleção de View](/data-sources/collection-view): Conecta-se a views de banco de dados existentes;
- [Coleção Externa](/data-sources/collection-fdw): Permite que o sistema de banco de dados acesse e consulte dados diretamente em fontes de dados externas, baseada na tecnologia FDW.