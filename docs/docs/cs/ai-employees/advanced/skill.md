:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pokročilé

## Úvod

Většina velkých jazykových modelů disponuje schopností používat nástroje. Plugin AI zaměstnanci obsahuje některé vestavěné běžné nástroje, které mohou velké jazykové modely využívat. Dovednosti, které nastavíte na stránce nastavení AI zaměstnanců, jsou právě těmito nástroji.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Nastavení dovedností

Přejděte na konfigurační stránku pluginu AI zaměstnanci a klikněte na záložku `AI employees`, čímž se dostanete na stránku správy AI zaměstnanců.

Vyberte AI zaměstnance, pro kterého chcete nastavit dovednosti, a klikněte na tlačítko `Edit` pro vstup na stránku úprav AI zaměstnance.

Na záložce `Skills` klikněte na tlačítko `Add Skill` pro přidání dovednosti pro aktuálního AI zaměstnance.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Představení dovedností

### Frontend

Skupina Frontend umožňuje AI zaměstnanci interagovat s front-end komponentami.

- Dovednost `Form filler` umožňuje AI zaměstnanci vyplnit vygenerovaná data formuláře zpět do uživatelem určeného formuláře.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Data modeling

Skupina dovedností Data modeling dává AI zaměstnanci schopnost volat interní API NocoBase pro modelování dat.

- `Intent Router` (směrovač záměrů) – určuje, zda uživatel chce upravit strukturu kolekce, nebo vytvořit novou.
- `Get collection names` – získá názvy všech existujících kolekcí v systému.
- `Get collection metadata` – získá informace o struktuře zadané kolekce.
- `Define collections` – umožňuje AI zaměstnanci vytvářet kolekce v systému.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` dává AI zaměstnanci schopnost spouštět pracovní postupy. Pracovní postupy nakonfigurované v pluginu pracovních postupů s `Trigger type` nastaveným na `AI employee event` budou zde k dispozici jako dovednosti pro AI zaměstnance.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Dovednosti ve skupině Code Editor primárně umožňují AI zaměstnanci interagovat s editorem kódu.

- `Get code snippet list` – získá seznam přednastavených úryvků kódu.
- `Get code snippet content` – získá obsah zadaného úryvku kódu.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Ostatní

- `Chart generator` – dává AI zaměstnanci schopnost generovat grafy a přímo je zobrazovat v konverzaci.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)