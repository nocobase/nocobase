---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Zdroj dat REST API

## Úvod

Tento plugin Vám umožňuje bezproblémovou integraci dat ze zdrojů REST API.

## Instalace

Jelikož se jedná o komerční plugin, je nutné jej nahrát a aktivovat prostřednictvím správce pluginů.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Přidání zdroje REST API

Po aktivaci pluginu můžete přidat zdroj REST API tak, že jej vyberete z rozbalovací nabídky „Přidat nový“ v sekci správy zdrojů dat.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Nakonfigurujte zdroj REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Přidání kolekce

V NocoBase je RESTful zdroj mapován na kolekci, například zdroj Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Tyto API endpointy jsou v NocoBase mapovány následovně:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Komplexního průvodce specifikacemi návrhu NocoBase API naleznete v dokumentaci API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Podrobné informace naleznete v kapitole „NocoBase API – Core“.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurace kolekce pro zdroj dat REST API zahrnuje následující:

### List

Namapujte rozhraní pro zobrazení seznamu zdrojů.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Namapujte rozhraní pro zobrazení detailů zdroje.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Namapujte rozhraní pro vytvoření zdroje.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Namapujte rozhraní pro aktualizaci zdroje.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Namapujte rozhraní pro smazání zdroje.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Rozhraní List a Get je nutné nakonfigurovat.

## Ladění API

### Integrace parametrů požadavku

Příklad: Nakonfigurujte parametry stránkování pro API List. Pokud API třetí strany nativně nepodporuje stránkování, NocoBase provede stránkování na základě načtených dat seznamu.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Vezměte prosím na vědomí, že účinné budou pouze proměnné přidané v rozhraní.

| Název parametru API třetí strany | Parametry NocoBase          |
| -------------------------------- | --------------------------- |
| page                             | {{request.params.page}}     |
| limit                            | {{request.params.pageSize}} |

Můžete kliknout na „Vyzkoušet“ (Try it out) pro ladění a zobrazení odpovědi.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformace formátu odpovědi

Formát odpovědi API třetí strany nemusí odpovídat standardu NocoBase a je třeba jej transformovat, aby se správně zobrazil na front-endu.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Upravte pravidla konverze na základě formátu odpovědi API třetí strany, abyste zajistili, že výstup bude odpovídat standardu NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Popis procesu ladění

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Proměnné

Zdroj dat REST API podporuje tři typy proměnných pro integraci API:

- Vlastní proměnné zdroje dat
- Proměnné požadavku NocoBase
- Proměnné odpovědi třetí strany

### Vlastní proměnné zdroje dat

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Požadavek NocoBase

- Params: Parametry dotazu URL (Search Params), které se liší v závislosti na rozhraní.
- Headers: Vlastní hlavičky požadavku, primárně poskytující specifické X- informace z NocoBase.
- Body: Tělo požadavku.
- Token: API token pro aktuální požadavek NocoBase.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Odpovědi třetích stran

V současné době je k dispozici pouze tělo odpovědi.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Níže jsou uvedeny proměnné dostupné pro každé rozhraní:

### List

| Parametr                | Popis                                              |
| ----------------------- | -------------------------------------------------- |
| request.params.page     | Aktuální stránka                                   |
| request.params.pageSize | Počet položek na stránku                           |
| request.params.filter   | Kritéria filtru (musí odpovídat formátu filtru NocoBase) |
| request.params.sort     | Kritéria řazení (musí odpovídat formátu řazení NocoBase) |
| request.params.appends  | Pole pro načítání na vyžádání, typicky pro asociační pole |
| request.params.fields   | Pole k zahrnutí (whitelist)                        |
| request.params.except   | Pole k vyloučení (blacklist)                       |

### Get

| Parametr                  | Popis                                              |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Povinné, typicky ID aktuálního záznamu             |
| request.params.filter     | Kritéria filtru (musí odpovídat formátu filtru NocoBase) |
| request.params.appends    | Pole pro načítání na vyžádání, typicky pro asociační pole |
| request.params.fields     | Pole k zahrnutí (whitelist)                        |
| request.params.except     | Pole k vyloučení (blacklist)                       |

### Create

| Parametr                 | Popis                       |
| ------------------------ | --------------------------- |
| request.params.whiteList | Whitelist                   |
| request.params.blacklist | Blacklist                   |
| request.body             | Počáteční data pro vytvoření |

### Update

| Parametr                  | Popis                                              |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Povinné, typicky ID aktuálního záznamu             |
| request.params.filter     | Kritéria filtru (musí odpovídat formátu filtru NocoBase) |
| request.params.whiteList  | Whitelist                                          |
| request.params.blacklist  | Blacklist                                          |
| request.body              | Data pro aktualizaci                               |

### Destroy

| Parametr                  | Popis                                              |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Povinné, typicky ID aktuálního záznamu             |
| request.params.filter     | Kritéria filtru (musí odpovídat formátu filtru NocoBase) |

## Konfigurace polí

Metadata polí (Fields) jsou extrahována z dat rozhraní CRUD adaptovaného zdroje a slouží jako pole kolekce.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrahujte metadata polí.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Pole a náhled.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Upravte pole (podobně jako u jiných zdrojů dat).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Přidání bloků zdroje dat REST API

Jakmile je kolekce nakonfigurována, můžete do rozhraní přidat bloky.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)