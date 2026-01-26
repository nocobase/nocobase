---
pkg: "@nocobase/plugin-field-sort"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Pole pro řazení

## Úvod

Pole pro řazení slouží k řazení záznamů v kolekci a podporují řazení v rámci skupin.

:::warning
Jelikož je pole pro řazení součástí stejné kolekce, nelze záznam přiřadit do více skupin při použití skupinového řazení.
:::

## Instalace

Vestavěný plugin, nevyžaduje samostatnou instalaci.

## Uživatelská příručka

### Vytvoření pole pro řazení

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Při vytváření polí pro řazení budou inicializovány hodnoty řazení:

- Pokud není vybráno skupinové řazení, inicializace proběhne na základě pole primárního klíče a pole data vytvoření.
- Pokud je vybráno skupinové řazení, data budou nejprve seskupena a poté proběhne inicializace na základě pole primárního klíče a pole data vytvoření.

:::warning{title="Vysvětlení transakční konzistence"}
- Při vytváření pole, pokud inicializace hodnoty řazení selže, pole pro řazení nebude vytvořeno.
- V rámci určitého rozsahu, pokud se záznam přesune z pozice A na pozici B, hodnoty řazení všech záznamů mezi A a B se změní. Pokud jakákoli část této aktualizace selže, celá operace přesunu bude vrácena zpět a hodnoty řazení souvisejících záznamů se nezmění.
:::

#### Příklad 1: Vytvoření pole sort1

Pole sort1 není seskupeno.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Pole pro řazení každého záznamu budou inicializována na základě pole primárního klíče a pole data vytvoření.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Příklad 2: Vytvoření pole sort2 na základě seskupení podle ID třídy

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

V tomto okamžiku budou všechny záznamy v kolekci nejprve seskupeny (seskupeno podle ID třídy) a poté bude inicializováno pole pro řazení (sort2). Počáteční hodnoty každého záznamu jsou:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Řazení přetažením (Drag-and-Drop)

Pole pro řazení se primárně používají pro řazení záznamů přetažením v různých blocích. Bloky, které aktuálně podporují řazení přetažením, zahrnují tabulky a nástěnky.

:::warning
- Pokud je stejné pole pro řazení použito pro řazení přetažením, použití napříč více bloky může narušit stávající pořadí.
- Pole pro řazení tabulky přetažením nemůže být pole pro řazení s pravidlem seskupení.
  - Výjimka: V bloku tabulky vztahů jedna k mnoha může cizí klíč sloužit jako skupina.
- V současné době pouze blok nástěnky podporuje řazení přetažením v rámci skupin.
:::

#### Řazení řádků tabulky přetažením

Blok tabulky

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Blok relační tabulky

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
V bloku vztahů jedna k mnoha:

- Pokud je vybráno neseskupené pole pro řazení, všechny záznamy se mohou účastnit řazení.
- Pokud jsou záznamy nejprve seskupeny podle cizího klíče a poté seřadí, pravidlo řazení ovlivní pouze data v rámci aktuální skupiny.

Konečný efekt je konzistentní, ale počet záznamů účastnících se řazení se liší. Více podrobností naleznete v [Vysvětlení pravidel řazení](#vysvětlení-pravidel-řazení).
:::

#### Řazení karet nástěnky přetažením

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Vysvětlení pravidel řazení

#### Posun mezi neseskupenými (nebo stejnými) prvky

Předpokládejme, že máme sadu dat:

```
[1,2,3,4,5,6,7,8,9]
```

Když se prvek, například 5, přesune dopředu na pozici 3, změní se pouze pozice prvků 3, 4 a 5. Prvek 5 zaujme pozici 3 a prvky 3 a 4 se posunou o jednu pozici dozadu.

```
[1,2,5,3,4,6,7,8,9]
```

Pokud poté přesuneme prvek 6 dozadu na pozici 8, prvek 6 zaujme pozici 8 a prvky 7 a 8 se posunou o jednu pozici dopředu.

```
[1,2,5,3,4,7,8,6,9]
```

#### Přesun prvků mezi různými skupinami

Při řazení podle skupin, pokud je záznam přesunut do jiné skupiny, změní se také jeho přiřazení ke skupině. Například:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Když se prvek 1 přesune za prvek 6 (výchozí chování), změní se také jeho skupina z A na B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Změny řazení nesouvisí s daty zobrazenými v rozhraní

Například, vezměme si sadu dat:

```
[1,2,3,4,5,6,7,8,9]
```

Rozhraní zobrazuje pouze filtrovaný pohled:

```
[1,5,9]
```

Když se prvek 1 přesune na pozici prvku 9, změní se také pozice všech mezilehlých prvků (2, 3, 4, 5, 6, 7, 8), i když nejsou viditelné.

```
[2,3,4,5,6,7,8,9,1]
```

Rozhraní nyní zobrazuje nové pořadí na základě filtrovaných položek:

```
[5,9,1]
```