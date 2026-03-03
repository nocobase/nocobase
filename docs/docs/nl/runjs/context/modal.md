:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/modal) voor nauwkeurige informatie.
:::

# ctx.modal

Een verkorte API gebaseerd op Ant Design Modal, gebruikt om actief modale vensters (informatieberichten, bevestigingsvensters, enz.) te openen in RunJS. Dit wordt geïmplementeerd door `ctx.viewer` / het weergavesysteem.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField** | Toon resultaten van bewerkingen, foutmeldingen of secundaire bevestigingen na gebruikersinteractie. |
| **Workflow / Actie-gebeurtenissen** | Bevestigingsvenster vóór indiening; beëindig vervolgstappen via `ctx.exit()` als de gebruiker annuleert. |
| **Koppelingsregels** | Vensters voor de gebruiker wanneer validatie mislukt. |

> Let op: `ctx.modal` is beschikbaar in RunJS-omgevingen met een weergavecontext (zoals JSBlocks binnen een pagina, workflows, enz.); het bestaat mogelijk niet in de backend of contexten zonder UI. Het wordt aanbevolen om optionele chaining (`ctx.modal?.confirm?.()`) te gebruiken bij het aanroepen.

## Type-definitie

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Retourneert true als de gebruiker op OK klikt, false bij annuleren
};
```

`ModalConfig` komt overeen met de configuratie van de statische methoden van Ant Design `Modal`.

## Veelgebruikte methoden

| Methode | Retourwaarde | Beschrijving |
|------|--------|------|
| `info(config)` | `Promise<void>` | Informatief modaal venster |
| `success(config)` | `Promise<void>` | Succesmelding modaal venster |
| `error(config)` | `Promise<void>` | Foutmelding modaal venster |
| `warning(config)` | `Promise<void>` | Waarschuwingsvenster |
| `confirm(config)` | `Promise<boolean>` | Bevestigingsvenster; retourneert `true` als de gebruiker op OK klikt, en `false` bij annuleren |

## Configuratieparameters

Overeenkomstig met Ant Design `Modal`, omvatten veelgebruikte velden:

| Parameter | Type | Beschrijving |
|------|------|------|
| `title` | `ReactNode` | Titel |
| `content` | `ReactNode` | Inhoud |
| `okText` | `string` | Tekst voor OK-knop |
| `cancelText` | `string` | Tekst voor Annuleer-knop (alleen voor `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Uitgevoerd bij klikken op OK |
| `onCancel` | `() => void` | Uitgevoerd bij klikken op Annuleren |

## Relatie met ctx.message en ctx.openView

| Doel | Aanbevolen gebruik |
|------|----------|
| **Lichte tijdelijke melding** | `ctx.message`, verdwijnt automatisch |
| **Info/Succes/Fout/Waarschuwing venster** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Secundaire bevestiging (vereist keuze gebruiker)** | `ctx.modal.confirm`, gebruikt in combinatie met `ctx.exit()` om de flow te beheren |
| **Complexe interacties zoals formulieren of lijsten** | `ctx.openView` om een aangepaste weergave te openen (pagina/lade/venster) |

## Voorbeelden

### Eenvoudig informatievenster

```ts
ctx.modal.info({
  title: 'Bericht',
  content: 'Bewerking voltooid',
});
```

### Bevestigingsvenster en procesbeheer

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Verwijderen bevestigen',
  content: 'Weet u zeker dat u dit record wilt verwijderen?',
  okText: 'Bevestigen',
  cancelText: 'Annuleren',
});
if (!confirmed) {
  ctx.exit();  // Beëindig vervolgstappen als de gebruiker annuleert
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Bevestigingsvenster met onOk

```ts
await ctx.modal.confirm({
  title: 'Indiening bevestigen',
  content: 'Wijzigingen kunnen na indiening niet meer worden aangepast. Wilt u doorgaan?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Foutmelding

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Succes', content: 'Bewerking voltooid' });
} catch (e) {
  ctx.modal.error({ title: 'Fout', content: e.message });
}
```

## Gerelateerd

- [ctx.message](./message.md): Lichte tijdelijke melding, verdwijnt automatisch
- [ctx.exit()](./exit.md): Veelgebruikt als `if (!confirmed) ctx.exit()` om het proces te beëindigen wanneer een gebruiker de bevestiging annuleert
- [ctx.openView()](./open-view.md): Opent een aangepaste weergave, geschikt voor complexe interacties