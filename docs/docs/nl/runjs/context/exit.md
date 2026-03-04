:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/exit) voor nauwkeurige informatie.
:::

# ctx.exit()

Beëindigt de uitvoering van de huidige event flow; volgende stappen worden niet uitgevoerd. Dit wordt vaak gebruikt wanneer niet aan de zakelijke voorwaarden wordt voldaan, de gebruiker annuleert of er een onherstelbare fout optreedt.

## Toepassingsscenario's

`ctx.exit()` wordt over het algemeen gebruikt in de volgende contexten waarin JS kan worden uitgevoerd:

| Scenario | Beschrijving |
|------|------|
| **Event flow** | In event flows die worden geactiveerd door formulierinzendingen, knopklikken, enz., beëindigt het de volgende stappen wanneer niet aan de voorwaarden wordt voldaan. |
| **Koppelingsregels** | Bij veldkoppelingen, filterkoppelingen, enz., beëindigt het de huidige event flow wanneer de validatie mislukt of de uitvoering moet worden overgeslagen. |
| **Actie-events** | Bij aangepaste acties (bijv. verwijderbevestiging, validatie vóór opslaan), stopt het wanneer de gebruiker annuleert of de validatie mislukt. |

> Verschil met `ctx.exitAll()`: `ctx.exit()` beëindigt alleen de huidige event flow; andere event flows onder hetzelfde event worden niet beïnvloed. `ctx.exitAll()` beëindigt zowel de huidige event flow als alle volgende event flows onder hetzelfde event die nog niet zijn uitgevoerd.

## Type-definitie

```ts
exit(): never;
```

Het aanroepen van `ctx.exit()` werpt een interne `FlowExitException` op, die wordt opgevangen door de FlowEngine om de uitvoering van de huidige event flow te stoppen. Eenmaal aangeroepen, zullen de resterende instructies in de huidige JS-code niet worden uitgevoerd.

## Vergelijking met ctx.exitAll()

| Methode | Toepassingsgebied |
|------|----------|
| `ctx.exit()` | Beëindigt alleen de huidige event flow; volgende event flows worden niet beïnvloed. |
| `ctx.exitAll()` | Beëindigt de huidige event flow en breekt volgende event flows onder hetzelfde event af die zijn ingesteld om **opeenvolgend uit te voeren**. |

## Voorbeelden

### Stoppen bij annulering door gebruiker

```ts
// In een bevestigingsvenster: beëindig de event flow als de gebruiker op annuleren klikt
if (!confirmed) {
  ctx.message.info('Bewerking geannuleerd');
  ctx.exit();
}
```

### Stoppen bij mislukte parametervalidatie

```ts
// Geef een melding en beëindig wanneer de validatie mislukt
if (!params.value || params.value.length < 3) {
  ctx.message.error('Ongeldige parameters, lengte moet minimaal 3 zijn');
  ctx.exit();
}
```

### Stoppen wanneer niet aan zakelijke voorwaarden wordt voldaan

```ts
// Beëindig als niet aan de voorwaarden wordt voldaan; volgende stappen worden niet uitgevoerd
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Alleen concepten kunnen worden ingediend' });
  ctx.exit();
}
```

### Kiezen tussen ctx.exit() en ctx.exitAll()

```ts
// Alleen de huidige event flow moet worden beëindigd → Gebruik ctx.exit()
if (!params.valid) {
  ctx.message.error('Ongeldige parameters');
  ctx.exit();  // Andere event flows worden niet beïnvloed
}

// Alle volgende event flows onder het huidige event moeten worden beëindigd → Gebruik ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Onvoldoende machtigingen' });
  ctx.exitAll();  // Zowel de huidige event flow als de volgende event flows onder hetzelfde event worden beëindigd
}
```

### Stoppen op basis van gebruikerskeuze na bevestigingsvenster

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Verwijderen bevestigen',
  content: 'Deze actie kan niet ongedaan worden gemaakt. Wilt u doorgaan?',
});
if (!ok) {
  ctx.message.info('Geannuleerd');
  ctx.exit();
}
```

## Opmerkingen

- Na het aanroepen van `ctx.exit()` zal de volgende code in de huidige JS niet worden uitgevoerd; het wordt aanbevolen om de reden aan de gebruiker uit te leggen via `ctx.message`, `ctx.notification` of een modaal venster voordat u deze aanroept.
- Normaal gesproken is het niet nodig om `FlowExitException` op te vangen in de businesscode; laat de FlowEngine dit afhandelen.
- Als u alle volgende event flows onder het huidige event wilt beëindigen, gebruik dan `ctx.exitAll()`.

## Gerelateerd

- [ctx.exitAll()](./exit-all.md): Beëindigt de huidige event flow en volgende event flows onder hetzelfde event.
- [ctx.message](./message.md): Berichtprompts.
- [ctx.modal](./modal.md): Bevestigingsvensters.