:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Oprávnění k akcím

## Úvod

V NocoBase 2.0 jsou oprávnění k akcím v současné době řízena především oprávněními k prostředkům **kolekce**:

-   **Oprávnění k prostředkům kolekce**: Slouží k jednotnému řízení základních oprávnění k akcím pro různé role u dané **kolekce**, jako je vytváření (Create), prohlížení (View), úprava (Update) a mazání (Delete). Toto oprávnění se vztahuje na celou **kolekci** v rámci **zdroje dat** a zajišťuje, že oprávnění role k odpovídajícím akcím pro danou **kolekci** zůstanou konzistentní napříč různými stránkami, vyskakovacími okny a bloky.
<!-- - **Nezávislé oprávnění k akci**: Slouží k detailnímu řízení viditelnosti akcí pro různé role, vhodné pro správu oprávnění pro specifické akce, jako je spuštění pracovního postupu, vlastní požadavek, externí odkaz atd. Tento typ oprávnění je vhodný pro řízení oprávnění na úrovni akce, což umožňuje různým rolím provádět specifické akce, aniž by to ovlivnilo konfiguraci oprávnění celé kolekce. -->

### Oprávnění k prostředkům kolekce

V systému oprávnění NocoBase jsou oprávnění k akcím **kolekcí** v zásadě rozdělena podle dimenzí CRUD, aby byla zajištěna konzistence a standardizace ve správě oprávnění. Například:

-   **Oprávnění k vytváření (Create)**: Řídí všechny akce související s vytvářením pro danou **kolekci**, včetně akcí přidání, duplikování atd. Pokud má role oprávnění k vytváření pro tuto **kolekci**, pak budou akce přidání, duplikování a další akce související s vytvářením viditelné na všech stránkách a ve všech vyskakovacích oknech.
-   **Oprávnění k mazání (Delete)**: Řídí akci mazání pro danou **kolekci**. Oprávnění zůstává konzistentní, ať už se jedná o hromadné mazání v bloku tabulky, nebo o mazání jednotlivého záznamu v bloku detailů.
-   **Oprávnění k úpravám (Update)**: Řídí akce typu úprav pro danou **kolekci**, jako jsou akce úpravy a akce aktualizace záznamu.
-   **Oprávnění k prohlížení (View)**: Řídí viditelnost dat této **kolekce**. Související datové bloky (tabulka, seznam, detaily atd.) jsou viditelné pouze tehdy, když má role oprávnění k prohlížení pro tuto **kolekci**.

Tento univerzální způsob správy oprávnění je vhodný pro standardizované řízení datových oprávnění a zajišťuje, že pro `stejnou kolekci` má `stejná akce` `konzistentní` pravidla oprávnění napříč `různými stránkami, vyskakovacími okny a bloky`, což poskytuje jednotnost a udržovatelnost.

#### Globální oprávnění

Globální oprávnění k akcím platí pro všechny **kolekce** v rámci **zdroje dat** a jsou rozdělena podle typu prostředku následovně:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Oprávnění k akcím pro konkrétní kolekce

Oprávnění k akcím pro konkrétní **kolekce** mají přednost před obecnými oprávněními **zdroje dat**, dále zpřesňují oprávnění k akcím a umožňují vlastní konfiguraci oprávnění pro přístup k prostředkům konkrétní **kolekce**. Tato oprávnění se dělí na dva aspekty:

1.  **Oprávnění k akcím**: Oprávnění k akcím zahrnují akce přidání, prohlížení, úpravy, mazání, exportu a importu. Tato oprávnění jsou konfigurována na základě dimenze rozsahu dat:
    -   **Všechna data**: Umožňuje uživatelům provádět akce se všemi záznamy v **kolekci**.
    -   **Vlastní data**: Omezuje uživatele provádět akce pouze s datovými záznamy, které sami vytvořili.

2.  **Oprávnění k polím**: Oprávnění k polím umožňují konfigurovat oprávnění pro každé pole v různých akcích. Například některá pole lze nakonfigurovat tak, aby byla pouze pro prohlížení a nebylo je možné upravovat.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

<!-- ### Nezávislá oprávnění k akcím

> **Poznámka**: Tato funkce je podporována **od verze v1.6.0-beta.13**

Na rozdíl od jednotných oprávnění k akcím, nezávislá oprávnění k akcím řídí pouze samotnou akci, což umožňuje, aby stejná akce měla různé konfigurace oprávnění na různých místech.

Tato metoda oprávnění je vhodná pro personalizované akce, například:

Akce spuštění pracovního postupu mohou vyžadovat volání různých pracovních postupů na různých stránkách nebo v blocích, a proto vyžadují nezávislé řízení oprávnění.
Vlastní akce na různých místech provádějí specifickou obchodní logiku a jsou vhodné pro samostatnou správu oprávnění.

V současné době lze nezávislá oprávnění konfigurovat pro následující akce:

-   Vyskakovací okno (řídí viditelnost a oprávnění k akci vyskakovacího okna)
-   Odkaz (omezuje, zda role může přistupovat k externím nebo interním odkazům)
-   Spuštění pracovního postupu (pro volání různých pracovních postupů na různých stránkách)
-   Akce v panelu akcí (např. skenování kódu, akce vyskakovacího okna, spuštění pracovního postupu, externí odkaz)
-   Vlastní požadavek (odesílá požadavek třetí straně)

Prostřednictvím konfigurace nezávislých oprávnění k akcím můžete detailněji spravovat oprávnění k akcím pro různé role, čímž se řízení oprávnění stane flexibilnějším.

![20250306215749](https://static-docs.nocobase.com/20250306215749.png)

Pokud není nastavena žádná role, je ve výchozím nastavení viditelná pro všechny role.

![20250306215854](https://static-docs.nocobase.com/20250306215854.png) -->

## Související dokumentace

[Konfigurace oprávnění]
<!-- (/users-and-permissions) -->