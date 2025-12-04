:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Co je FlowEngine?

FlowEngine je zcela nový no-code a low-code vývojový engine pro frontend, který byl představen v NocoBase 2.0. Kombinuje modely (Model) s toky (Flow), čímž zjednodušuje frontendovou logiku a zvyšuje znovupoužitelnost a udržovatelnost. Zároveň, díky konfigurovatelnosti toků (Flow), propůjčuje frontendovým komponentám a obchodní logice no-code možnosti konfigurace a orchestrace.

## Proč se jmenuje FlowEngine?

Protože ve FlowEngine nejsou vlastnosti a logika komponent staticky definovány, ale jsou řízeny a spravovány pomocí **toku (Flow)**.

*   **Tok (Flow)**, podobně jako datový proud, rozkládá logiku na uspořádané kroky (Step) a postupně je aplikuje na komponentu.
*   **Engine** vyjadřuje, že se jedná o engine, který pohání frontendovou logiku a interakce.

Proto platí: **FlowEngine = Frontendový logický engine řízený toky**.

## Co je Model?

Ve FlowEngine je Model abstraktním modelem komponenty, který je zodpovědný za:

*   Správu **vlastností (Props) a stavu** komponenty;
*   Definování **způsobu vykreslování** komponenty;
*   Hostování a provádění **toku (Flow)**;
*   Jednotné zpracování **distribuce událostí** a **životního cyklu**.

Jinými slovy, **Model je logickým mozkem komponenty**, který ji mění ze statického prvku na konfigurovatelnou a orchestratelnou dynamickou jednotku.

## Co je Flow?

Ve FlowEngine je **Flow logickým tokem, který slouží Modelu**.
Jeho účelem je:

*   Rozdělit logiku vlastností nebo událostí na kroky (Step) a provádět je postupně, jako tok;
*   Spravovat změny vlastností i reakce na události;
*   Učinit logiku **dynamickou, konfigurovatelnou a znovupoužitelnou**.

## Jak tyto koncepty pochopit?

Můžete si **tok (Flow)** představit jako **proud vody**:

*   **Krok (Step) je jako uzel na cestě vodního proudu.**
    Každý krok (Step) plní malý úkol (např. nastavení vlastnosti, spuštění události, volání API), stejně jako voda působí, když prochází stavidlem nebo vodním kolem.

*   **Tok je uspořádaný.**
    Vodní proud teče po předem určené cestě od pramene k ústí, postupně prochází všemi kroky (Step); podobně se logika v toku (Flow) provádí v definovaném pořadí.

*   **Tok lze rozdělit a kombinovat.**
    Proud vody se může rozdělit na několik menších proudů nebo se spojit dohromady; tok (Flow) lze také rozdělit na více podtoků nebo zkombinovat do složitějších logických řetězců.

*   **Tok je konfigurovatelný a ovladatelný.**
    Směr a objem vodního proudu lze regulovat stavidlem; způsob provádění a parametry toku (Flow) lze také ovládat pomocí konfigurace (stepParams).

### Shrnutí analogie

*   **Komponenta** je jako vodní kolo, které potřebuje proud vody, aby se otáčelo.
*   **Model** je základna a ovladač tohoto vodního kola, zodpovědný za příjem vody a řízení jeho provozu.
*   **Tok (Flow)** je onen proud vody, který postupně prochází každým krokem (Step) a pohání komponentu k neustálým změnám a reakcím.

Takže ve FlowEngine platí:

*   **Flow umožňuje logice přirozeně proudit jako voda.**
*   **Model pak činí komponentu nositelem a vykonavatelem tohoto proudu.**