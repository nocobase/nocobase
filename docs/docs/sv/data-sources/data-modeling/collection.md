:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Samlingsöversikt

NocoBase erbjuder ett unikt DSL för att beskriva datastrukturer. Detta DSL, som kallas en samling, förenar datastrukturer från olika källor och lägger en pålitlig grund för datahantering, analys och applikationer.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

För att smidigt kunna använda olika datamodeller, stöder NocoBase skapandet av olika typer av samlingar:

- [Allmän samling](/data-sources/data-source-main/general-collection): Innehåller inbyggda, vanliga systemfält;
- [Ärvd samling](/data-sources/data-source-main/inheritance-collection): Här kan ni skapa en överordnad samling och sedan härleda en underordnad samling från den. Den underordnade samlingen ärver den överordnade samlingens struktur och kan även definiera egna kolumner.
- [Trädsamling](/data-sources/collection-tree): En samling med trädstruktur som för närvarande endast stöder design med grannlistor (adjacency list);
- [Kalendersamling](/data-sources/calendar/calendar-collection): Används för att skapa händelsesamlingar relaterade till kalendrar;
- [Filsamling](/data-sources/file-manager/file-collection): Används för hantering av fillagring;
- : Används för scenarier med dynamiska uttryck i arbetsflöden;
- [SQL-samling](/data-sources/collection-sql): Är inte en faktisk databassamling, utan presenterar snabbt SQL-frågor på ett strukturerat sätt;
- [Vysamling](/data-sources/collection-view): Ansluter till befintliga databasvyer;
- [Extern samling](/data-sources/collection-fdw): Tillåter databassystemet att direkt komma åt och fråga data i externa datakällor, baserat på FDW-teknik.