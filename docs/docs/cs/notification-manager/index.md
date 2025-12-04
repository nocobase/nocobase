---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Správa oznámení

## Úvod

Správa oznámení je centralizovaná služba, která integruje více kanálů pro oznámení. Poskytuje jednotné rozhraní pro konfiguraci kanálů, správu odesílání a protokolování a podporuje flexibilní rozšíření.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- Fialová část: Správa oznámení poskytuje komplexní službu, která zahrnuje konfiguraci kanálů, protokolování a další funkce, s možností rozšíření o další kanály oznámení.
- Zelená část: Zprávy v aplikaci (In-App Message), vestavěný kanál, který umožňuje uživatelům přijímat oznámení přímo v aplikaci.
- Červená část: E-mail (Email), rozšiřitelný kanál, který umožňuje uživatelům přijímat oznámení e-mailem.

## Správa kanálů

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Aktuálně podporované kanály:

- [Zprávy v aplikaci](/notification-manager/notification-in-app-message)
- [E-mail](/notification-manager/notification-email) (používá vestavěný SMTP přenos)

Můžete také rozšířit podporu o další kanály oznámení, viz dokumentace [Rozšíření kanálů](/notification-manager/development/extension).

## Protokoly oznámení

Systém podrobně zaznamenává informace o odeslání a stavu každého oznámení, což usnadňuje analýzu a řešení problémů.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Uzel oznámení v pracovním postupu

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)