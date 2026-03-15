:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/exit-all) voor nauwkeurige informatie.
:::

# ctx.exitAll()

Beëindigt de huidige event flow en alle volgende event flows die in dezelfde event-dispatch worden geactiveerd. Dit wordt vaak gebruikt wanneer alle event flows onder het huidige event onmiddellijk moeten worden afgebroken vanwege een globale fout of een mislukte machtigingscontrole.

## Toepassingsscenario's

`ctx.exitAll()` wordt over het algemeen gebruikt in contexten waarin JS kan worden uitgevoerd en waarbij het noodzakelijk is om **gelijktijdig de huidige event flow en de daaropvolgende event flows die door dat event zijn geactiveerd, af te breken**:

| Scenario | Beschrijving |
|------|------|
| **Event flow** | De validatie van de hoofd-event flow mislukt (bijv. onvoldoende machtigingen), waardoor de hoofdstroom en alle volgende, nog niet uitgevoerde stromen onder hetzelfde event moeten worden beëindigd. |
| **Koppelingsregels** | Wanneer de validatie van een koppeling mislukt, moeten de huidige koppeling en de daaropvolgende koppelingen die door hetzelfde event zijn geactiveerd, worden beëindigd. |
| **Actie-events** | De validatie voorafgaand aan een actie mislukt (bijv. machtigingscontrole voor verwijderen), waardoor de hoofdactie en de vervolgstappen moeten worden voorkomen. |

> Verschil met `ctx.exit()`: `ctx.exit()` beëindigt alleen de huidige event flow; `ctx.exitAll()` beëindigt de huidige event flow en alle **niet-uitgevoerde** volgende event flows in dezelfde event-dispatch.

## Type-definitie

```ts
exitAll(): never;
```

Het aanroepen van `ctx.exitAll()` werpt een interne `FlowExitAllException` op, die wordt opgevangen door de FlowEngine om de huidige event flow-instantie en de daaropvolgende event flows onder hetzelfde event te stoppen. Eenmaal aangeroepen, zullen de resterende instructies in de huidige JS-code niet worden uitgevoerd.

## Vergelijking met ctx.exit()

| Methode | Bereik |
|------|----------|
| `ctx.exit()` | Beëindigt alleen de huidige event flow; volgende event flows worden niet beïnvloed. |
| `ctx.exitAll()` | Beëindigt de huidige event flow en breekt volgende event flows af die **opeenvolgend** onder hetzelfde event worden uitgevoerd. |

## Toelichting uitvoeringsmodus

- **Opeenvolgende uitvoering (sequential)**: Event flows onder hetzelfde event worden in volgorde uitgevoerd. Nadat een event flow `ctx.exitAll()` aanroept, zullen de volgende event flows niet meer worden uitgevoerd.
- **Parallelle uitvoering (parallel)**: Event flows onder hetzelfde event worden parallel uitgevoerd. Het aanroepen van `ctx.exitAll()` in de ene event flow zal andere gelijktijdige event flows niet onderbreken (aangezien deze onafhankelijk zijn).

## Voorbeelden

### Alle event flows beëindigen wanneer de machtigingscontrole mislukt

```ts
// Aborteer de hoofd-event flow en volgende event flows bij onvoldoende machtigingen
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Geen machtiging voor bewerking' });
  ctx.exitAll();
}
```

### Beëindigen wanneer de globale pre-validatie mislukt

```ts
// Bijv.: Als bij verwijderen blijkt dat gekoppelde gegevens niet verwijderd kunnen worden, voorkom dan de hoofd-event flow en vervolgacties
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Kan niet verwijderen: er bestaan gekoppelde gegevens');
  ctx.exitAll();
}
```

### Kiezen tussen ctx.exit() en ctx.exitAll()

```ts
// Alleen de huidige event flow moet worden afgesloten -> Gebruik ctx.exit()
if (!params.valid) {
  ctx.message.error('Ongeldige parameters');
  ctx.exit();  // Volgende event flows worden niet beïnvloed
}

// Alle volgende event flows onder het huidige event moeten worden beëindigd -> Gebruik ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Onvoldoende machtigingen' });
  ctx.exitAll();  // Zowel de hoofd-event flow als de volgende event flows onder hetzelfde event worden beëindigd
}
```

### Eerst een melding geven, dan beëindigen

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Corrigeer eerst de fouten in het formulier');
  ctx.exitAll();
}
```

## Opmerkingen

- Na het aanroepen van `ctx.exitAll()` wordt de resterende code in de huidige JS niet uitgevoerd. Het wordt aanbevolen om de reden aan de gebruiker uit te leggen via `ctx.message`, `ctx.notification` of een modal voordat u de functie aanroept.
- In de bedrijfscode is het meestal niet nodig om `FlowExitAllException` op te vangen; laat de FlowEngine dit afhandelen.
- Als u alleen de huidige event flow wilt stoppen zonder de volgende te beïnvloeden, gebruik dan `ctx.exit()`.
- In de parallelle modus beëindigt `ctx.exitAll()` alleen de huidige event flow en onderbreekt het geen andere gelijktijdige event flows.

## Gerelateerd

- [ctx.exit()](./exit.md): Beëindigt alleen de huidige event flow
- [ctx.message](./message.md): Berichtmeldingen
- [ctx.modal](./modal.md): Bevestigingsvenster