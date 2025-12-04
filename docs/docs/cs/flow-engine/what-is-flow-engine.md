:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Co je FlowEngine?

FlowEngine je nový front-endový no-code/low-code vývojový engine, který byl představen v NocoBase 2.0. Kombinuje modely (Model) a toky (Flow), aby zjednodušil front-endovou logiku a zvýšil její znovupoužitelnost a udržitelnost. Zároveň, díky konfigurovatelnosti toků (Flow), poskytuje no-code možnosti konfigurace a orchestrace pro front-endové komponenty a obchodní logiku.

## Proč se jmenuje FlowEngine?

Protože v FlowEngine vlastnosti a logika komponent již nejsou staticky definovány, ale jsou řízeny a spravovány **toky (Flow)**.

*   **Flow**, podobně jako datový tok, rozděluje logiku na uspořádané kroky (Step), které se postupně aplikují na komponentu.
*   **Engine** vyjadřuje, že se jedná o engine, který pohání front-endovou logiku a interakce.

Proto, **FlowEngine = Front-endový logický engine poháněný toky**.

## Co je Model?

V FlowEngine je Model abstraktním modelem komponenty, který je zodpovědný za:

*   Správu **vlastností (Props) a stavu** komponenty.
*   Definování **způsobu vykreslování** komponenty.
*   Hostování a provádění **toků (Flow)**.
*   Jednotné zpracování **distribuce událostí** a **životních cyklů**.

Jinými slovy, **Model je logickým mozkem komponenty**, který ji transformuje ze statické jednotky na dynamickou jednotku, kterou lze konfigurovat a orchestrálně spravovat.

## Co je Flow?

V FlowEngine je **Flow logickým tokem, který slouží Modelu**.
Jeho účelem je:

*   Rozdělit logiku vlastností nebo událostí na kroky (Step) a provádět je postupně jako tok.
*   Spravovat změny vlastností i reakce na události.
*   Učinit logiku **dynamickou, konfigurovatelnou a znovupoužitelnou**.

## Jak těmto konceptům porozumět?

**Flow** si můžete představit jako **proud vody**:

*   **Krok (Step) je jako uzel podél vodního proudu**
    Každý krok plní malý úkol (např. nastavení vlastnosti, spuštění události, volání API), stejně jako proud vody působí, když prochází stavidlem nebo vodním kolem.

*   **Toky jsou uspořádané**
    Proud vody sleduje předem určenou cestu od pramene k ústí a postupně prochází všemi kroky; podobně se logika v toku (Flow) provádí v definovaném pořadí.

*   **Toky lze rozvětvovat a kombinovat**
    Proud vody se může rozdělit na několik menších proudů nebo se spojit dohromady; tok (Flow) lze také rozdělit na více dílčích toků nebo zkombinovat do složitějších logických řetězců.

*   **Toky jsou konfigurovatelné a ovladatelné**
    Směr a objem vodního proudu lze regulovat stavidlem; způsob provádění a parametry toku (Flow) lze také řídit konfigurací (stepParams).

### Shrnutí přirovnání

*   **Komponenta** je jako vodní kolo, které potřebuje proud vody, aby se otáčelo.
*   **Model** je základnou a ovladačem tohoto vodního kola, zodpovědným za příjem vodního proudu a řízení jeho provozu.
*   **Flow** je onen proud vody, který postupně prochází každým krokem (Step) a pohání komponentu k neustálým změnám a reakcím.

V FlowEngine tedy platí:

*   **Flow** umožňuje logice přirozeně proudit jako voda.
*   **Model** pak umožňuje komponentám stát se nositeli a vykonavateli tohoto proudu.