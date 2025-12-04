---
pkg: "@nocobase/plugin-calendar"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Kalendářový blok

## Úvod

Kalendářový blok nabízí přehledný způsob zobrazení a správy událostí a datově souvisejících informací v kalendářovém formátu. Je ideální pro plánování schůzek, organizaci akcí a efektivní řízení času.

## Instalace

Tento plugin je předinstalovaný, takže není nutná žádná další instalace.

## Přidání bloku

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Pole názvu: Slouží k zobrazení informací na lištách kalendáře. V současné době podporuje typy polí jako `input` (jednoduchý text), `select` (jednoduchý výběr), `phone` (telefon), `email` (e-mail), `radioGroup` (skupina přepínačů) a `sequence` (sekvence). Podporované typy polí pro název lze rozšířit pomocí pluginů.
2.  Čas zahájení: Označuje začátek úkolu.
3.  Čas ukončení: Označuje konec úkolu.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Kliknutím na lištu úkolu se výběr zvýrazní a otevře se podrobné vyskakovací okno.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Konfigurace bloku

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Zobrazení lunárního kalendáře

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

- 
- 

### Nastavení rozsahu dat

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Další informace naleznete v části .

### Nastavení výšky bloku

Příklad: Upravte výšku bloku kalendáře objednávek. Uvnitř kalendářového bloku se neobjeví žádný posuvník.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Další informace naleznete v části .

### Pole barvy pozadí

:::info{title=Tip}
Verze NocoBase musí být v1.4.0-beta nebo vyšší.
:::

Tato možnost slouží ke konfiguraci barvy pozadí událostí v kalendáři. Používá se následovně:

1.  Tabulka dat kalendáře musí obsahovat pole typu **Jednoduchý výběr (Single select)** nebo **Skupina přepínačů (Radio group)**, přičemž toto pole musí mít nakonfigurované barvy.
2.  Poté se vraťte do konfiguračního rozhraní kalendářového bloku a v poli **Barva pozadí** vyberte pole, které jste právě nakonfigurovali s barvami.
3.  Nakonec můžete zkusit vybrat barvu pro událost v kalendáři a kliknout na Odeslat. Uvidíte, že barva se projevila.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Počáteční den týdne

> Podporováno ve verzi v1.7.7 a vyšší

Kalendářový blok podporuje nastavení počátečního dne týdne, což vám umožňuje zvolit **neděli** nebo **pondělí** jako první den týdne. Výchozí počáteční den je **pondělí**, což uživatelům usnadňuje přizpůsobení zobrazení kalendáře podle regionálních zvyklostí pro lepší uživatelský zážitek.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Konfigurace akcí

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Dnes

Tlačítko „Dnes“ v kalendářovém bloku nabízí rychlou navigaci, která uživatelům umožňuje okamžitě se vrátit na aktuální datum po prozkoumávání jiných dat.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Přepnutí zobrazení

Výchozí zobrazení je nastaveno na Měsíc.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)