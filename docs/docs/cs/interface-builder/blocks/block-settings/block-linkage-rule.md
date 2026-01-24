:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pravidla propojení bloků

## Úvod

Pravidla propojení bloků umožňují uživatelům dynamicky řídit zobrazení bloků a spravovat prezentaci prvků na úrovni bloku jako celku. Jelikož bloky slouží jako kontejnery pro pole a akční tlačítka, tato pravidla uživatelům umožňují flexibilně řídit zobrazení celého pohledu z dimenze bloku.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Poznámka**: Před spuštěním pravidel propojení bloků musí zobrazení bloku nejprve projít **kontrolou oprávnění ACL**. Teprve když uživatel disponuje příslušnými přístupovými oprávněními, vyhodnocuje se logika pravidel propojení bloků. Jinými slovy, pravidla propojení bloků se uplatní až po splnění požadavků na oprávnění k zobrazení ACL. Pokud pravidla propojení bloků nejsou definována, blok se zobrazí ve výchozím nastavení.

### Řízení bloků pomocí globálních proměnných

**Pravidla propojení bloků** podporují použití globálních proměnných pro dynamické řízení obsahu zobrazovaného v blocích, což umožňuje uživatelům s různými rolemi a oprávněními vidět a interagovat s přizpůsobenými datovými pohledy. Například v systému pro správu objednávek, ačkoli různé role (jako jsou administrátoři, prodejci a finanční pracovníci) mají oprávnění k prohlížení objednávek, pole a akční tlačítka, která každá role potřebuje vidět, se mohou lišit. Konfigurací globálních proměnných můžete flexibilně upravit zobrazená pole, akční tlačítka a dokonce i pravidla řazení a filtrování dat na základě role uživatele, oprávnění nebo jiných podmínek.

#### Konkrétní případy použití:

-   **Řízení rolí a oprávnění**: Řízení viditelnosti nebo editovatelnosti určitých polí na základě oprávnění různých rolí. Například prodejci mohou vidět pouze základní informace o objednávce, zatímco finanční pracovníci mohou vidět podrobnosti o platbě.
-   **Personalizované pohledy**: Přizpůsobení různých pohledů bloků pro různá oddělení nebo týmy, což zajišťuje, že každý uživatel vidí pouze obsah relevantní pro jeho práci, čímž se zvyšuje efektivita.
-   **Správa oprávnění k akcím**: Řízení zobrazení akčních tlačítek pomocí globálních proměnných. Například některé role mohou pouze prohlížet data, zatímco jiné role mohou provádět akce jako úpravy nebo mazání.

### Řízení bloků pomocí kontextových proměnných

Bloky lze také řídit pomocí proměnných v kontextu. Například můžete použít kontextové proměnné jako „Aktuální záznam“, „Aktuální formulář“ a „Aktuální záznam ve vyskakovacím okně“ k dynamickému zobrazení nebo skrytí bloků.

Příklad: Blok „Informace o obchodní příležitosti objednávky“ se zobrazí pouze tehdy, když je stav objednávky „Zaplaceno“.

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Více informací o pravidlech propojení naleznete v části [Pravidla propojení](/interface-builder/linkage-rule).