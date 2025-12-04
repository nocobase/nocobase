:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Výchozí hodnota

## Úvod

Výchozí hodnota je počáteční hodnota pole při vytváření nového záznamu. Můžete ji nastavit pro pole při jeho konfiguraci v **kolekci**, nebo ji můžete zadat pro pole v bloku formuláře pro přidání. Lze ji nastavit jako konstantu nebo proměnnou.

## Kde nastavit výchozí hodnoty

### Pole kolekce

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Pole ve formuláři pro přidání

Většina polí ve formuláři pro přidání podporuje nastavení výchozí hodnoty.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Přidávání v podformuláři

Podřízená data přidaná prostřednictvím pole podformuláře, ať už ve formuláři pro přidání nebo úpravu, budou mít výchozí hodnotu.

Přidat nové v podformuláři
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Při úpravě existujících dat se prázdné pole nevyplní výchozí hodnotou. Výchozí hodnotou se vyplní pouze nově přidaná data.

### Výchozí hodnoty pro relační pole

Výchozí hodnoty mají pouze vztahy typu **Mnoho k jednomu** a **Mnoho k mnoha**, a to při použití komponent pro výběr (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Proměnné výchozích hodnot

### Jaké proměnné jsou k dispozici

- Aktuální uživatel;
- Aktuální záznam; tento koncept se týká pouze existujících záznamů;
- Aktuální formulář, ideálně uvádí pouze pole ve formuláři;
- Aktuální objekt, koncept v rámci podformulářů (datový objekt pro každý řádek v podformuláři);
- Parametry URL
  Více informací o proměnných naleznete v [Proměnné](/interface-builder/variables)

### Proměnné výchozích hodnot polí

Dělí se do dvou kategorií: pole bez vztahů a relační pole.

#### Proměnné výchozích hodnot relačních polí

- Objekt proměnné musí být záznam **kolekce**;
- Musí to být **kolekce** v dědičné hierarchii, což může být aktuální **kolekce** nebo nadřazená/podřízená **kolekce**;
- Proměnná „Vybrané záznamy tabulky“ je k dispozici pouze pro relační pole „Mnoho k mnoha“ a „Jeden k mnoha/Mnoho k jednomu“;
- **Pro víceúrovňové scénáře je nutné ji zploštit a odstranit duplicity.**

```typescript
// Vybrané záznamy tabulky:
[{id:1},{id:2},{id:3},{id:4}]

// Vybrané záznamy tabulky/k jednomu:
[{kJednomu: {id:2}}, {kJednomu: {id:3}}, {kJednomu: {id:3}}]
// Zploštit a odstranit duplicity
[{id: 2}, {id: 3}]

// Vybrané záznamy tabulky/k mnoha:
[{kMnoha: [{id: 1}, {id:2}]}, {kMnoha: {[id:3}, {id:4}]}]
// Zploštit
[{id:1},{id:2},{id:3},{id:4}]
```

#### Proměnné výchozích hodnot pro pole bez vztahů

- Typy musí být konzistentní nebo kompatibilní, např. řetězce jsou kompatibilní s čísly a všemi objekty, které poskytují metodu toString;
- Pole JSON je speciální a může ukládat jakýkoli typ dat;

### Úroveň pole (volitelná pole)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Proměnné výchozích hodnot pro pole bez vztahů
  - Při výběru víceúrovňových polí je to omezeno na vztahy typu „k jednomu“ a nepodporuje vztahy typu „k mnoha“;
  - Pole JSON je speciální a může být bez omezení;

- Proměnné výchozích hodnot relačních polí
  - hasOne, podporuje pouze vztahy typu „k jednomu“;
  - hasMany, podporuje jak „k jednomu“ (interní konverze), tak „k mnoha“;
  - belongsToMany, podporuje jak „k jednomu“ (interní konverze), tak „k mnoha“;
  - belongsTo, obecně pro „k jednomu“, ale když je nadřazený vztah hasMany, podporuje také „k mnoha“ (protože hasMany/belongsTo je v podstatě vztah mnoho k mnoha);

## Speciální případy

### Vztah „Mnoho k mnoha“ je ekvivalentní kombinaci „Jeden k mnoha/Mnoho k jednomu“

Model

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Proč vztahy „Jeden k jednomu“ a „Jeden k mnoha“ nemají výchozí hodnoty?

Například ve vztahu A.B, pokud je b1 spojeno s a1, nemůže být spojeno s a2. Pokud se b1 spojí s a2, jeho spojení s a1 bude zrušeno. V tomto případě data nejsou sdílena, zatímco výchozí hodnota je mechanismus sdílení (všechny mohou být spojeny). Proto vztahy „Jeden k jednomu“ a „Jeden k mnoha“ nemohou mít výchozí hodnoty.

### Proč podformuláře nebo podtabulky vztahů „Mnoho k jednomu“ a „Mnoho k mnoha“ nemohou mít výchozí hodnoty?

Protože podformuláře a podtabulky se zaměřují na přímou úpravu relačních dat (včetně přidávání a odebírání), zatímco výchozí hodnota vztahu je mechanismus sdílení, kde všechny mohou být spojeny, ale relační data nelze upravovat. Proto není vhodné v tomto scénáři poskytovat výchozí hodnoty.

Navíc podformuláře nebo podtabulky mají podřízená pole a nebylo by jasné, zda je výchozí hodnota pro podformulář nebo podtabulku výchozí hodnotou řádku nebo sloupce.

S ohledem na všechny faktory je vhodnější, aby podformuláře nebo podtabulky nemohly mít přímo nastavené výchozí hodnoty, bez ohledu na typ vztahu.