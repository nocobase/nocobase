---
pkg: "@nocobase/plugin-client"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Správce tras

## Úvod

Správce tras je nástroj pro správu tras hlavních stránek systému, podporující `desktopová` a `mobilní` zařízení. Trasy vytvořené pomocí správce tras se automaticky synchronizují do menu (lze je však nastavit tak, aby se v menu nezobrazovaly). Naopak, položky menu přidané v menu stránek se rovněž synchronizují do seznamu správce tras.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Uživatelská příručka

### Typy tras

Systém podporuje čtyři typy tras:

- Skupina (group): Slouží k seskupování a správě tras; může obsahovat podřízené trasy.
- Stránka (page): Interní stránka systému.
- Záložka (tab): Typ trasy používaný pro přepínání mezi záložkami v rámci stránky.
- Odkaz (link): Interní nebo externí odkaz, který přímo přesměruje na nakonfigurovanou adresu.

### Přidání trasy

Pro vytvoření nové trasy klikněte na tlačítko „Add new“ v pravém horním rohu:

1. Vyberte typ trasy (Type).
2. Vyplňte název trasy (Title).
3. Vyberte ikonu trasy (Icon).
4. Nastavte, zda se má trasa zobrazovat v menu (Show in menu).
5. Nastavte, zda povolit záložky stránky (Enable page tabs).
6. U typu stránky systém automaticky vygeneruje unikátní cestu trasy (Path).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Akce s trasami

Každá položka trasy podporuje následující akce:

- Add child: Přidat podřízenou trasu
- Edit: Upravit konfiguraci trasy
- View: Zobrazit stránku trasy
- Delete: Smazat trasu

### Hromadné akce

Horní panel nástrojů nabízí následující hromadné akce:

- Refresh: Obnovit seznam tras
- Delete: Smazat vybrané trasy
- Hide in menu: Skrýt vybrané trasy v menu
- Show in menu: Zobrazit vybrané trasy v menu

### Filtrování tras

Pomocí funkce „Filter“ v horní části můžete filtrovat seznam tras podle potřeby.

:::info{title=Poznámka}
Úpravy konfigurace tras přímo ovlivní strukturu navigačního menu systému. Prosíme, postupujte opatrně a ujistěte se, že konfigurace tras je správná.
:::