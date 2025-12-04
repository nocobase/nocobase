---
pkg: '@nocobase/plugin-acl'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Konfigurace oprávnění

## Obecná nastavení oprávnění

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Oprávnění ke konfiguraci

1. **Povoluje konfiguraci rozhraní**: Toto oprávnění určuje, zda uživatel smí konfigurovat uživatelské rozhraní. Po jeho aktivaci se zobrazí tlačítko pro konfiguraci UI. Role "admin" má toto oprávnění ve výchozím nastavení povolené.
2. **Povoluje instalaci, aktivaci a deaktivaci pluginů**: Toto oprávnění určuje, zda uživatel smí aktivovat nebo deaktivovat **pluginy**. Po jeho aktivaci získá uživatel přístup k rozhraní správce **pluginů**. Role "admin" má toto oprávnění ve výchozím nastavení povolené.
3. **Povoluje konfiguraci pluginů**: Toto oprávnění umožňuje uživateli konfigurovat parametry **pluginů** nebo spravovat data backendu **pluginů**. Role "admin" má toto oprávnění ve výchozím nastavení povolené.
4. **Povoluje vymazání mezipaměti a restart aplikace**: Toto oprávnění souvisí se systémovými úkoly údržby, jako je vymazání mezipaměti a restartování aplikace. Po aktivaci se související tlačítka pro operace zobrazí v osobním centru. Toto oprávnění je ve výchozím nastavení zakázáno.
5. **Nové položky menu jsou ve výchozím nastavení přístupné**: Nově vytvořená menu jsou ve výchozím nastavení přístupná a toto nastavení je ve výchozím nastavení povoleno.

### Globální oprávnění k akcím

Globální oprávnění k akcím platí univerzálně pro všechny **kolekce** a jsou kategorizována podle typu operace. Tato oprávnění lze konfigurovat na základě rozsahu dat: všechna data nebo vlastní data uživatele. První možnost umožňuje provádět operace s celou **kolekcí**, zatímco druhá omezuje operace pouze na data relevantní pro uživatele.

## Oprávnění k akcím kolekce

![](https://static-docs.nocobase.com/6a6e028139cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Oprávnění k akcím **kolekce** umožňují jemné doladění globálních oprávnění k akcím konfigurací přístupu k prostředkům v rámci každé **kolekce**. Tato oprávnění jsou rozdělena do dvou aspektů:

1.  **Oprávnění k akcím**: Zahrnují akce přidání, zobrazení, úpravy, smazání, exportu a importu. Oprávnění jsou nastavena na základě rozsahu dat:
    -   **Všechny záznamy**: Uděluje uživateli možnost provádět akce se všemi záznamy v rámci **kolekce**.
    -   **Vlastní záznamy**: Omezuje uživatele na provádění akcí pouze se záznamy, které sám vytvořil.

2.  **Oprávnění k polím**: Oprávnění k polím vám umožňují nastavit specifická oprávnění pro každé pole během různých operací. Například některá pole lze nakonfigurovat jako pouze pro zobrazení, bez oprávnění k úpravám.

## Oprávnění k přístupu k menu

Oprávnění k přístupu k menu řídí přístup na základě položek menu.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Oprávnění ke konfiguraci pluginů

Oprávnění ke konfiguraci **pluginů** řídí možnost konfigurovat specifické parametry **pluginů**. Po jejich povolení se v administračním centru zobrazí odpovídající rozhraní pro správu **pluginů**.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)