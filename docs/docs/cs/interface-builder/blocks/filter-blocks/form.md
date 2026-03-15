:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/blocks/filter-blocks/form).
:::

# Filtrační formulář

## Představení

Filtrační formulář umožňuje uživatelům filtrovat data vyplněním polí formuláře. Lze jej použít k filtrování bloků tabulek, bloků grafů, bloků seznamů atd.

## Jak používat

Pojďme se nejprve rychle seznámit s použitím filtračního formuláře na jednoduchém příkladu. Předpokládejme, že máme blok tabulky obsahující informace o uživatelích a chceme mít možnost filtrovat data pomocí filtračního formuláře. Jako v tomto případě:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Kroky konfigurace jsou následující:

1. Zapněte režim konfigurace, přidejte na stránku blok „Filtrační formulář“ a „Blok tabulky“.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. V bloku tabulky a bloku filtračního formuláře přidejte pole „Přezdívka“.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Nyní jej můžete začít používat.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Pokročilé použití

Blok filtračního formuláře podporuje více pokročilých konfigurací, níže jsou uvedena některá běžná použití.

### Propojení více bloků

Jediné pole formuláře může současně filtrovat data z více bloků. Konkrétní postup je následující:

1. Klikněte na položku konfigurace „Connect fields“ u pole.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Přidejte cílové bloky, které mají být propojeny, zde vybereme blok seznamu na stránce.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Vyberte jedno nebo více polí v bloku seznamu pro propojení. Zde vybereme pole „Přezdívka“.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Kliknutím na tlačítko Uložit dokončete konfiguraci, výsledek je zobrazen níže:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Propojení s bloky grafů

Odkaz: [Stránkové filtry a propojení](../../../data-visualization/guide/filters-and-linkage.md)

### Vlastní pole

Kromě výběru polí z datové tabulky můžete také vytvořit pole formuláře prostřednictvím „Vlastních polí“. Například můžete vytvořit pole s výběrem a vlastními možnostmi. Konkrétní postup je následující:

1. Klikněte na možnost „Vlastní pole“, zobrazí se konfigurační rozhraní.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Vyplňte název pole, v „Typu pole“ vyberte „Výběr“ a nakonfigurujte možnosti.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nově přidaná vlastní pole je třeba ručně propojit s poli cílového bloku, postup je následující:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurace je dokončena, výsledek je zobrazen níže:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Aktuálně podporované typy polí jsou:

- Textové pole
- Číslo
- Datum
- Výběr
- Přepínač
- Zaškrtávací políčko
- Propojený záznam

#### Propojený záznam (vlastní pole vztahu)

„Propojený záznam“ je vhodný pro scénáře „filtrování podle záznamů v propojené tabulce“. Například v seznamu objednávek filtrovat objednávky podle „Zákazníka“ nebo v seznamu úkolů filtrovat úkoly podle „Odpovědné osoby“.

Popis položek konfigurace:

- **Cílová datová tabulka**: Určuje, ze které datové tabulky (kolekce) se mají načíst volitelné záznamy.
- **Pole titulku**: Používá se jako zobrazovaný text pro rozbalovací možnosti a vybrané štítky (např. jméno, název).
- **Pole hodnoty**: Používá se jako hodnota odeslaná při skutečném filtrování, obvykle se volí pole primárního klíče (např. `id`).
- **Povolit vícenásobný výběr**: Po zapnutí lze vybrat více záznamů najednou.
- **Operátor**: Definuje, jak se shodují podmínky filtru (viz vysvětlení „Operátor“ níže).

Doporučená konfigurace:

1. U `Pole titulku` vyberte dobře čitelné pole (např. „Jméno“), aby se předešlo použití čistých ID, což ovlivňuje použitelnost.
2. U `Pole hodnoty` upřednostněte pole primárního klíče, aby bylo zajištěno stabilní a jedinečné filtrování.
3. V situacích s jedním výběrem obvykle vypněte `Povolit vícenásobný výběr`, v situacích s více výběry jej zapněte a použijte vhodný `Operátor`.

#### Operátor

`Operátor` se používá k definování vztahu shody mezi „hodnotou pole filtračního formuláře“ a „hodnotou pole cílového bloku“.

### Sbalení

Přidáním tlačítka pro sbalení můžete obsah filtračního formuláře sbalit a rozbalit, čímž ušetříte místo na stránce.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Podporovány jsou následující konfigurace:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Počet řádků zobrazených při sbalení**: Nastavuje počet řádků polí formuláře zobrazených ve sbaleném stavu.
- **Výchozí sbalení**: Po zapnutí se filtrační formulář ve výchozím nastavení zobrazí ve sbaleném stavu.