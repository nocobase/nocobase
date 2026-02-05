:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Postupy údržby

## První spuštění aplikace

Při prvním spuštění aplikace nejprve spusťte jeden uzel. Počkejte, dokud se pluginy nenainstalují a neaktivují, a teprve poté spusťte ostatní uzly.

## Aktualizace verze

Pokud potřebujete aktualizovat verzi NocoBase, postupujte podle tohoto návodu.

:::warning{title=Upozornění}
V **produkčním prostředí** clusteru by se funkce jako správa pluginů a aktualizace verzí měly používat s opatrností nebo by měly být zakázány.

NocoBase v současné době nepodporuje online aktualizace pro clusterové verze. Pro zajištění konzistence dat je nutné během procesu aktualizace pozastavit externí služby.
:::

Kroky:

1.  Zastavte aktuální službu

    Zastavte všechny instance aplikace NocoBase a přesměrujte provoz ze zátěžového balanceru na stránku se stavem 503.

2.  Zálohujte data

    Před aktualizací důrazně doporučujeme zálohovat data databáze, abyste předešli případným problémům během procesu aktualizace.

3.  Aktualizujte verzi

    Pro aktualizaci verze image aplikace NocoBase se podívejte na [Aktualizace Dockeru](../get-started/upgrading/docker).

4.  Spusťte službu

    1. Spusťte jeden uzel v clusteru a počkejte, dokud se aktualizace nedokončí a uzel se úspěšně nespustí.
    2. Ověřte správnou funkčnost. Pokud se vyskytnou problémy, které nelze vyřešit odstraňováním potíží, můžete se vrátit k předchozí verzi.
    3. Spusťte ostatní uzly.
    4. Přesměrujte provoz ze zátěžového balanceru na aplikační cluster.

## Údržba v rámci aplikace

Údržba v rámci aplikace se týká provádění operací souvisejících s údržbou, zatímco je aplikace spuštěna, a zahrnuje:

*   Správa pluginů (instalace, aktivace, deaktivace pluginů atd.)
*   Zálohování a obnova
*   Správa migrace prostředí

Kroky:

1.  Zmenšete počet uzlů

    Snižte počet uzlů, na kterých běží aplikace v clusteru, na jeden a zastavte službu na ostatních uzlech.

2.  Proveďte údržbové operace v rámci aplikace, například instalaci a aktivaci pluginů, zálohování dat atd.

3.  Obnovte uzly

    Po dokončení údržbových operací a ověření správné funkčnosti spusťte ostatní uzly. Jakmile se uzly úspěšně spustí, obnovte provozní stav clusteru.