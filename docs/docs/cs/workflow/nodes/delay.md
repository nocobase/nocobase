:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Zpoždění

## Úvod

Uzel Zpoždění umožňuje přidat do **pracovního postupu** časovou prodlevu. Po uplynutí této prodlevy se **pracovní postup** buď pokračuje v provádění následujících uzlů, nebo se předčasně ukončí, a to v závislosti na konfiguraci.

Často se používá ve spojení s uzlem Paralelní větev. Uzel Zpoždění můžete přidat do jedné z větví, abyste zajistili zpracování po vypršení časového limitu. Například v paralelní větvi jedna větev obsahuje ruční zpracování a druhá větev uzel Zpoždění. Pokud ruční zpracování překročí časový limit a je nastaveno na „selhat při vypršení časového limitu“, znamená to, že ruční zpracování musí být dokončeno v omezeném čase. Pokud je nastaveno na „pokračovat při vypršení časového limitu“, znamená to, že po uplynutí času lze ruční zpracování ignorovat.

## Instalace

Jedná se o vestavěný **plugin**, takže není nutná žádná instalace.

## Vytvoření uzlu

V rozhraní pro konfiguraci **pracovního postupu** klikněte na tlačítko plus („+“) v toku a přidejte uzel „Zpoždění“:

![Vytvoření uzlu Zpoždění](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Konfigurace uzlu

![Uzel Zpoždění_Konfigurace uzlu](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Doba zpoždění

Pro dobu zpoždění můžete zadat číslo a vybrat časovou jednotku. Podporované časové jednotky jsou: sekundy, minuty, hodiny, dny a týdny.

### Stav po vypršení časového limitu

Pro stav po vypršení časového limitu si můžete vybrat „Projít a pokračovat“ nebo „Selhat a ukončit“. První možnost znamená, že po uplynutí zpoždění bude **pracovní postup** pokračovat v provádění následujících uzlů. Druhá možnost znamená, že po uplynutí zpoždění se **pracovní postup** předčasně ukončí se stavem selhání.

## Příklad

Vezměme si scénář, kdy je třeba na pracovní požadavek odpovědět v omezeném čase po jeho iniciaci. Musíme přidat uzel pro ruční zpracování do jedné ze dvou paralelních větví a uzel Zpoždění do druhé. Pokud na ruční zpracování nebude odpovězeno do 10 minut, stav pracovního požadavku se aktualizuje na „vypršel časový limit a nezpracováno“.

![Uzel Zpoždění_Příklad_Organizace toku](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)