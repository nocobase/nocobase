---
pkg: '@nocobase/plugin-app-supervisor'
---

# Správa více aplikací

## Přehled

NocoBase umožňuje spravovat více fyzicky oddělených aplikací přes jednu vstupní správu pomocí AppSupervisor.


Na začátku stačí jedna aplikace. S růstem ale roste složitost, náklady a potřeba izolace.


V režimu sdílené paměti běží více aplikací v jedné instanci. Každá může mít vlastní databázi, ale sdílí proces a paměť.

![](https://static-docs.nocobase.com/202512231055907.png)


Pro větší škálu použijte hybridní režim: Supervisor + více Worker prostředí pro lepší izolaci a škálování.

![](https://static-docs.nocobase.com/202512231215186.png)
