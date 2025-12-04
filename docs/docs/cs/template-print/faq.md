:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Časté problémy a řešení

### 1. Prázdné sloupce a buňky v šablonách Excelu mizí ve vygenerovaných výsledcích

**Popis problému**: V šablonách Excelu se může stát, že buňka bez obsahu nebo formátování bude při generování dokumentu odstraněna, což vede k chybějícím buňkám ve výsledném souboru.

**Řešení**:

- **Vyplňte barvu pozadí**: Prázdným buňkám v cílové oblasti nastavte barvu pozadí, abyste zajistili, že zůstanou viditelné během procesu generování.
- **Vložte mezery**: Do prázdných buněk vložte znak mezery. Tím se zachová struktura buňky, i když neobsahuje žádný skutečný obsah.
- **Nastavte ohraničení**: Přidejte k tabulce styly ohraničení, abyste zvýraznili hranice buněk a zabránili jejich zmizení během generování.

**Příklad**:

V šabloně Excelu nastavte všem cílovým buňkám světle šedé pozadí a do prázdných buněk vložte mezery.

### 2. Sloučené buňky jsou ve výstupu neplatné

**Popis problému**: Při použití funkce cyklu pro generování tabulek mohou sloučené buňky v šabloně vést k abnormálním výsledkům generování, například ke ztrátě efektu sloučení nebo k chybnému zarovnání dat.

**Řešení**:

- **Vyhněte se používání sloučených buněk**: Snažte se vyhnout používání sloučených buněk v tabulkách generovaných cyklem, abyste zajistili správné vykreslení dat.
- **Použijte zarovnání přes výběr**: Pokud potřebujete text vodorovně zarovnat na střed přes více buněk, použijte funkci „Zarovnat přes výběr“ namísto slučování buněk.
- **Omezte pozice sloučených buněk**: Pokud jsou sloučené buňky nezbytné, slučujte je pouze nad tabulkou nebo napravo od ní. Vyhněte se slučování buněk pod tabulkou nebo nalevo od ní, abyste předešli ztrátě efektu sloučení během generování.

### 3. Obsah pod oblastí cyklického generování způsobuje narušení formátu

**Popis problému**: V šablonách Excelu, pokud se pod oblastí cyklu, která se dynamicky rozšiřuje na základě datových položek (např. detaily objednávky), nachází další obsah (např. souhrn objednávky, poznámky), pak se při generování datové řádky vytvořené cyklem rozšíří směrem dolů. To přímo přepíše nebo posune statický obsah pod nimi, což vede k narušení formátu a překrývání obsahu ve výsledném dokumentu.

**Řešení**:

  * **Upravte rozložení, umístěte oblast cyklu na spodek**: Toto je nejvíce doporučená metoda. Oblast tabulky, která vyžaduje cyklické generování, umístěte na spodek celého listu. Veškeré informace, které se původně nacházely pod ní (souhrn, podpisy atd.), přesuňte nad oblast cyklu. Tímto způsobem se data z cyklu mohou volně rozšiřovat směrem dolů, aniž by ovlivnila jakékoli jiné prvky.
  * **Vyhraďte dostatek prázdných řádků**: Pokud musí být obsah umístěn pod oblastí cyklu, odhadněte maximální počet řádků, které cyklus může vygenerovat, a ručně vložte dostatek prázdných řádků jako vyrovnávací paměť mezi oblast cyklu a obsah pod ní. Tato metoda však nese rizika – pokud skutečná data překročí odhadovaný počet řádků, problém se objeví znovu.
  * **Použijte šablony Wordu**: Pokud jsou požadavky na rozložení složité a nelze je vyřešit úpravou struktury Excelu, zvažte použití dokumentů Wordu jako šablon. Tabulky ve Wordu automaticky posouvají obsah níže, když se zvyšuje počet řádků, bez problémů s překrýváním obsahu, což je činí vhodnějšími pro generování takových dynamických dokumentů.

**Příklad**:

**Špatný přístup**: Umístění informací „Souhrn objednávky“ ihned pod tabulku „Detaily objednávky“ generovanou cyklem.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Správný přístup 1 (úprava rozložení)**: Přesuňte informace „Souhrn objednávky“ nad tabulku „Detaily objednávky“, čímž se oblast cyklu stane spodním prvkem stránky.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Správný přístup 2 (vyhrazení prázdných řádků)**: Vyhraďte mnoho prázdných řádků mezi „Detaily objednávky“ a „Souhrnem objednávky“, abyste zajistili, že obsah cyklu bude mít dostatek prostoru pro rozšíření.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Správný přístup 3**: Použijte šablony Wordu.

### 4. Během generování šablony se objevují chybová hlášení

**Popis problému**: Během generování šablony systém zobrazuje chybová hlášení, což vede k selhání generování.

**Možné příčiny**:

- **Chyby v zástupných symbolech**: Názvy zástupných symbolů neodpovídají polím v datové sadě nebo obsahují syntaktické chyby.
- **Chybějící data**: V datové sadě chybí pole odkazovaná v šabloně.
- **Nesprávné použití formátovače**: Parametry formátovače jsou nesprávné nebo se jedná o nepodporované typy formátování.

**Řešení**:

- **Zkontrolujte zástupné symboly**: Ujistěte se, že názvy zástupných symbolů v šabloně odpovídají názvům polí v datové sadě a mají správnou syntaxi.
- **Ověřte datovou sadu**: Potvrďte, že datová sada obsahuje všechna pole odkazovaná v šabloně a že mají správné datové formáty.
- **Upravte formátovače**: Zkontrolujte metody použití formátovače, ujistěte se, že parametry jsou správné, a používejte podporované typy formátování.

**Příklad**:

**Chybná šablona**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Datová sada**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Chybí pole totalAmount
}
```

**Řešení**: Přidejte pole `totalAmount` do datové sady nebo odstraňte odkaz na `totalAmount` ze šablony.