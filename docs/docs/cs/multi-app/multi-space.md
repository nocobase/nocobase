---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Více prostorů

## Úvod

**Plugin Více prostorů** umožňuje v rámci jedné instance aplikace vytvářet několik nezávislých datových prostorů prostřednictvím logické izolace.

#### Případy použití
- **Více obchodů nebo továren**: Obchodní procesy a konfigurace systému jsou vysoce konzistentní, například jednotná správa zásob, plánování výroby, prodejní strategie a šablony reportů, ale je nutné zajistit, aby se data jednotlivých obchodních jednotek navzájem nerušila.
- **Správa více organizací nebo dceřiných společností**: Více organizací nebo dceřiných společností v rámci holdingové společnosti sdílí stejnou platformu, ale každá značka má nezávislá data o zákaznících, produktech a objednávkách.

## Instalace

Ve správci **pluginů** najděte **plugin Více prostorů (Multi-Space)** a povolte jej.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Uživatelská příručka

### Správa více prostorů

Po povolení **pluginu** přejděte na stránku nastavení **„Uživatelé a oprávnění“** a přepněte se na panel **Prostory**, kde můžete spravovat prostory.

> Zpočátku existuje vestavěný **Nepřiřazený prostor (Unassigned Space)**, který slouží především k prohlížení starých dat, jež nejsou spojena s žádným prostorem.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Vytvoření prostoru

Klikněte na tlačítko „Přidat prostor“ pro vytvoření nového prostoru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Přiřazení uživatelů

Po výběru vytvořeného prostoru můžete na pravé straně nastavit uživatele, kteří k tomuto prostoru patří:

> **Tip:** Po přiřazení uživatelů k prostoru je nutné **ručně obnovit stránku**, aby se seznam pro přepínání prostorů v pravém horním rohu aktualizoval a zobrazil nejnovější prostor.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Přepínání a prohlížení více prostorů

V pravém horním rohu můžete přepínat aktuální prostor.
Když kliknete na **ikonu oka** vpravo (v zvýrazněném stavu), můžete současně prohlížet data z více prostorů.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Správa dat ve více prostorech

Po povolení **pluginu** systém automaticky přednastaví **pole Prostor** při vytváření **kolekce**.
**Pouze kolekce, které obsahují toto pole, budou zahrnuty do logiky správy prostorů.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

U existujících **kolekcí** můžete ručně přidat pole Prostor pro povolení správy prostorů:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Výchozí logika

V **kolekcích**, které obsahují pole Prostor, systém automaticky aplikuje následující logiku:

1. Při vytváření dat jsou automaticky přiřazena k aktuálně vybranému prostoru;
2. Při filtrování dat jsou automaticky omezena na data aktuálně vybraného prostoru.

### Klasifikace starých dat do více prostorů

Data, která existovala před povolením **pluginu Více prostorů**, můžete klasifikovat do prostorů pomocí následujících kroků:

#### 1. Přidání pole Prostor

Ručně přidejte pole Prostor do staré **kolekce**:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Přiřazení uživatelů k Nepřiřazenému prostoru

Přiřaďte uživatele, který spravuje stará data, ke všem prostorům, včetně **Nepřiřazeného prostoru (Unassigned Space)**, abyste mohli prohlížet data, která dosud nebyla přiřazena k žádnému prostoru:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Přepnutí na zobrazení dat ze všech prostorů

V horní části vyberte zobrazení dat ze všech prostorů:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Konfigurace stránky pro přiřazení starých dat

Vytvořte novou stránku pro přiřazení starých dat. Zobrazte „pole Prostor“ na **stránce seznamu** a **stránce úprav**, abyste mohli ručně upravit přiřazení prostoru.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Nastavte pole Prostor jako editovatelné

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Ruční přiřazení dat k prostorům

Prostřednictvím výše uvedené stránky ručně upravte data a postupně přiřaďte správný prostor starým datům (můžete si také sami nakonfigurovat hromadné úpravy).