---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/multi-space/multi-space).
:::

# Více prostorů (Multi-space)

## Úvod

**Plugin Více prostorů (Multi-space)** umožňuje v rámci jedné instance aplikace vytvořit více nezávislých datových prostorů prostřednictvím logické izolace.

#### Případy užití
- **Více prodejen nebo továren**: Obchodní procesy a konfigurace systému jsou vysoce konzistentní – například jednotná správa zásob, plánování výroby, prodejní strategie a šablony přehledů – ale data pro každou obchodní jednotku musí zůstat nezávislá.
- **Správa více organizací nebo dceřiných společností**: Více organizací nebo dceřiných společností v rámci mateřské společnosti sdílí stejnou platformu, ale každá značka má nezávislá data o zákaznících, produktech a objednávkách.

## Instalace

V správci pluginů vyhledejte plugin **Multi-space** a povolte jej.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Uživatelská příručka

### Správa více prostorů

Po povolení pluginu přejděte na stránku nastavení **„Uživatelé a oprávnění“** a přepněte na panel **Prostory**, kde můžete prostory spravovat.

> Ve výchozím nastavení existuje vestavěný **Nepřiřazený prostor (Unassigned Space)**, který slouží především k prohlížení starších dat, která ještě nebyla přidružena k žádnému prostoru.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Vytvoření prostoru

Kliknutím na tlačítko „Přidat prostor“ vytvoříte nový prostor:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Přiřazení uživatelů

Po výběru vytvořeného prostoru můžete na pravé straně nastavit uživatele, kteří do tohoto prostoru patří:

> **Tip:** Po přiřazení uživatelů k prostoru musíte **ručně obnovit stránku**, aby se přepínač prostorů v pravém horním rohu aktualizoval a zobrazil nejnovější prostory.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Přepínání a prohlížení prostorů

V pravém horním rohu můžete přepínat aktuální prostor.  
Kliknutím na **ikonu oka** na pravé straně (ve zvýrazněném stavu) můžete prohlížet data z více prostorů současně.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Správa dat ve více prostorech

Po povolení pluginu systém při vytváření kolekce (Collection) automaticky přednastaví **pole Prostor**.  
**Pouze kolekce obsahující toto pole budou zahrnuty do logiky správy prostorů.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

U stávajících kolekcí můžete pole prostor přidat ručně a povolit tak správu prostorů:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Výchozí logika

V kolekcích, které obsahují pole prostor, systém automaticky aplikuje následující logiku:

1. Při vytváření dat jsou tato automaticky přidružena k aktuálně vybranému prostoru;
2. Při filtrování dat jsou výsledky automaticky omezeny na data aktuálně vybraného prostoru.

### Kategorizace starších dat do prostorů

U dat, která existovala před povolením pluginu Multi-space, můžete provést jejich kategorizaci do prostorů pomocí následujících kroků:

#### 1. Přidání pole Prostor

Ručně přidejte pole prostor do starší kolekce:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Přiřazení uživatelů k nepřiřazenému prostoru

Přiřaďte uživatele spravující starší data ke všem prostorům, včetně **Nepřiřazeného prostoru (Unassigned Space)**, aby mohli vidět data, která dosud nebyla přiřazena k žádnému prostoru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Přepnutí na zobrazení dat ze všech prostorů

V horní části vyberte možnost pro zobrazení dat ze všech prostorů:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurace stránky pro přiřazení starších dat

Vytvořte novou stránku pro přiřazení starších dat. V **bloku seznamu** i v **editačním formuláři** zobrazte „pole Prostor“, abyste mohli ručně upravit přiřazení k prostoru.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Nastavení pole prostor do režimu úprav:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Ruční přiřazení dat k prostorům

Pomocí výše uvedené stránky ručně upravte data a postupně přiřaďte starším datům správný prostor (můžete také sami nakonfigurovat hromadné úpravy).