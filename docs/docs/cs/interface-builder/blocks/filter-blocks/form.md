:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Filtrační formulář

## Úvod

Filtrační formulář umožňuje uživatelům filtrovat data vyplněním příslušných polí. Můžete jej použít k filtrování bloků tabulek, grafů, seznamů a mnoha dalších.

## Jak používat

Pojďme se nejprve podívat na jednoduchý příklad, abychom rychle pochopili, jak filtrační formulář používat. Představte si, že máme blok tabulky obsahující uživatelské informace a chceme data filtrovat pomocí filtračního formuláře, takto:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Kroky konfigurace:

1. Povolte režim úprav a přidejte na stránku blok "Filtrační formulář" a blok "Tabulka".
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Přidejte pole „Přezdívka“ do bloku tabulky i do bloku filtračního formuláře.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Nyní jej můžete začít používat.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Pokročilé použití

Blok filtračního formuláře podporuje pokročilejší konfigurace. Níže uvádíme některé běžné případy použití.

### Propojení více bloků

Jediné pole formuláře může současně filtrovat data napříč více bloky. Postup je následující:

1. Klikněte na konfigurační možnost „Connect fields“ (Propojit pole) u daného pole.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Přidejte cílové bloky, které chcete propojit. V tomto příkladu vybereme blok seznamu na stránce.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Vyberte jedno nebo více polí z bloku seznamu, která chcete propojit. Zde vybereme pole „Přezdívka“.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Kliknutím na tlačítko Uložit dokončete konfiguraci. Výsledek vypadá takto:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Propojení bloků grafů

Odkaz: [Filtry a propojení stránek](../../../data-visualization/guide/filters-and-linkage.md)

### Vlastní pole

Kromě výběru polí z kolekcí můžete také vytvářet pole formuláře pomocí „Vlastních polí“. Můžete například vytvořit rozbalovací pole s vlastními možnostmi. Postup je následující:

1. Klikněte na možnost „Vlastní pole“ pro otevření konfiguračního panelu.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Vyplňte název pole, vyberte „Select“ (Výběr) jako model pole a nakonfigurujte možnosti.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nově přidaná vlastní pole je třeba ručně propojit s poli v cílových blocích. Postup je následující:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurace je dokončena. Výsledek vypadá takto:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Aktuálně podporované modely polí:

- `Input`: Jednořádkové textové pole
- `Number`: Číselné vstupní pole
- `Date`: Výběr data
- `Select`: Rozbalovací seznam (lze nastavit pro jeden nebo vícenásobný výběr)
- `Radio group`: Skupina přepínačů
- `Checkbox group`: Skupina zaškrtávacích políček

### Sbalení

Přidáním tlačítka pro sbalení můžete obsah filtračního formuláře sbalit a rozbalit, čímž ušetříte místo na stránce.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Podporované konfigurace:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Počet řádků zobrazených při sbalení**: Nastavuje počet řádků polí formuláře zobrazených ve sbaleném stavu.
- **Ve výchozím nastavení sbaleno**: Pokud je tato možnost povolena, filtrační formulář se ve výchozím nastavení zobrazí ve sbaleném stavu.