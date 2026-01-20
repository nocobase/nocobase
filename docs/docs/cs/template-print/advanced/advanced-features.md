:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Pokročilé funkce

### Stránkování

#### 1. Aktualizace čísel stránek

##### Syntaxe
Stačí vložit do vašeho Office softwaru.

##### Příklad
V aplikaci Microsoft Word:
- Použijte funkci „Vložení → Číslo stránky“.
V aplikaci LibreOffice:
- Použijte funkci „Vložení → Pole → Číslo stránky“.

##### Výsledek
V generované zprávě se čísla stránek na každé stránce automaticky aktualizují.

#### 2. Generování obsahu

##### Syntaxe
Stačí vložit do vašeho Office softwaru.

##### Příklad
V aplikaci Microsoft Word:
- Použijte funkci „Vložení → Rejstřík a tabulky → Obsah“.
V aplikaci LibreOffice:
- Použijte funkci „Vložení → Obsah a rejstřík → Obsah, rejstřík nebo bibliografie“.

##### Výsledek
Obsah zprávy se automaticky aktualizuje podle obsahu dokumentu.

#### 3. Opakování záhlaví tabulky

##### Syntaxe
Stačí vložit do vašeho Office softwaru.

##### Příklad
V aplikaci Microsoft Word:
- Klikněte pravým tlačítkem na záhlaví tabulky → Vlastnosti tabulky → Zaškrtněte „Opakovat jako řádek záhlaví na každé stránce“.
V aplikaci LibreOffice:
- Klikněte pravým tlačítkem na záhlaví tabulky → Vlastnosti tabulky → Karta Tok textu → Zaškrtněte „Opakovat záhlaví“.

##### Výsledek
Když se tabulka rozprostírá přes více stránek, záhlaví se automaticky opakuje v horní části každé stránky.

### Internacionalizace (i18n)

#### 1. Překlad statického textu

##### Syntaxe
Pro internacionalizaci statického textu použijte značku `{t(text)}`:
```
{t(meeting)}
```

##### Příklad
V šabloně:
```
{t(meeting)} {t(apples)}
```
Odpovídající překlady jsou poskytnuty v datech JSON nebo v externím lokalizačním slovníku (například pro "fr-fr"), například "meeting" → "rendez-vous", "apples" → "Pommes".

##### Výsledek
Při generování zprávy bude text nahrazen odpovídajícím překladem podle cílového jazyka.

#### 2. Překlad dynamického textu

##### Syntaxe
Pro datový obsah můžete použít formátovač `:t`, například:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Příklad
V šabloně:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Odpovídající překlady jsou poskytnuty v datech JSON a lokalizačním slovníku.

##### Výsledek
Na základě podmínky bude výstupem „lundi“ nebo „mardi“ (s použitím cílového jazyka jako příkladu).

### Mapování klíč-hodnota

#### 1. Převod výčtu (:convEnum)

##### Syntaxe
```
{data:convEnum(enumName)}
```
Například:
```
0:convEnum('ORDER_STATUS')
```

##### Příklad
V příkladu možností API je uvedeno následující:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
V šabloně:
```
0:convEnum('ORDER_STATUS')
```

##### Výsledek
Výstupem je „pending“; pokud index překročí rozsah výčtu, je výstupem původní hodnota.

### Dynamické obrázky
:::info
Aktuálně podporuje typy souborů XLSX a DOCX
:::
Do šablon dokumentů můžete vkládat „dynamické obrázky“, což znamená, že zástupné obrázky v šabloně budou během vykreslování automaticky nahrazeny skutečnými obrázky na základě dat. Tento proces je velmi jednoduchý a vyžaduje pouze:

1. Vložte dočasný obrázek jako zástupný symbol.
2. Upravte „Alternativní text“ (Alt Text) tohoto obrázku a nastavte popisek pole.
3. Vykreslete dokument a systém jej automaticky nahradí skutečným obrázkem.

Níže si na konkrétních příkladech vysvětlíme metody práce s DOCX a XLSX.

#### Vkládání dynamických obrázků do souborů DOCX
##### Nahrazení jednoho obrázku

1. Otevřete svou šablonu DOCX a vložte dočasný obrázek (může to být jakýkoli zástupný obrázek, například [jednobarevný modrý obrázek](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Pokyny k formátu obrázku**

- V současné době zástupné obrázky podporují pouze formát PNG. Doporučujeme použít náš poskytnutý příklad [jednobarevného modrého obrázku](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Cílové vykreslené obrázky podporují pouze formáty PNG, JPG, JPEG. Jiné typy obrázků se nemusí vykreslit správně.

**Pokyny k velikosti obrázku**

Ať už jde o DOCX nebo XLSX, konečná velikost vykresleného obrázku bude odpovídat rozměrům dočasného obrázku v šabloně. To znamená, že skutečný nahrazující obrázek se automaticky přizpůsobí velikosti zástupného obrázku, který jste vložili. Pokud chcete, aby vykreslený obrázek měl velikost 150×150, použijte v šabloně dočasný obrázek a upravte jej na tuto velikost.
:::

2. Klikněte pravým tlačítkem na tento obrázek, upravte jeho „Alternativní text“ (Alt Text) a vyplňte popisek pole obrázku, který chcete vložit, například `{d.imageUrl}`:

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Pro vykreslení použijte následující ukázková data:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Ve vykresleném výsledku bude dočasný obrázek nahrazen skutečným obrázkem:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Nahrazení více obrázků v cyklu

Pokud chcete do šablony vložit skupinu obrázků, například seznam produktů, můžete to také provést pomocí cyklů. Konkrétní kroky jsou následující:

1. Předpokládejme, že vaše data jsou následující:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. V šabloně DOCX nastavte oblast cyklu a do každé položky cyklu vložte dočasné obrázky s alternativním textem nastaveným na `{d.products[i].imageUrl}`, jak je znázorněno níže:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Po vykreslení budou všechny dočasné obrázky nahrazeny odpovídajícími datovými obrázky:

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Vkládání dynamických obrázků do souborů XLSX

V šablonách Excelu (XLSX) je způsob ovládání v podstatě stejný, jen si všimněte následujících bodů:

1. Po vložení obrázku se ujistěte, že je vybrán „obrázek v buňce“, nikoli obrázek plovoucí nad buňkou.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Po výběru buňky klikněte na „Alternativní text“ (Alt Text) a vyplňte popisek pole, například `{d.imageUrl}`.

### Čárový kód
:::info
Aktuálně podporuje typy souborů XLSX a DOCX
:::

#### Generování čárových kódů (například QR kódů)

Generování čárových kódů funguje stejně jako dynamické obrázky a vyžaduje pouze tři kroky:

1. Vložte do šablony dočasný obrázek, který označí pozici čárového kódu.
2. Upravte „Alternativní text“ obrázku a zapište popisek pole formátu čárového kódu, například `{d.code:barcode(qrcode)}`, kde `qrcode` je typ čárového kódu (viz seznam podporovaných typů níže).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Po vykreslení bude zástupný obrázek automaticky nahrazen odpovídajícím obrázkem čárového kódu:

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Podporované typy čárových kódů

| Název čárového kódu | Typ   |
| ------------------- | ----- |
| QR kód              | qrcode |