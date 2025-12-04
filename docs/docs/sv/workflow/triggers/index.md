:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt

En trigger är startpunkten för ett arbetsflöde. När en händelse som uppfyller triggerns villkor inträffar medan applikationen körs, kommer arbetsflödet att triggas och köras. Triggertypen är också arbetsflödets typ, som väljs när du skapar arbetsflödet och kan inte ändras efteråt. De för närvarande stödda triggertyperna är följande:

- [Samlingshändelser](./collection) (Inbyggd)
- [Schemaläggning](./schedule) (Inbyggd)
- [Före åtgärd](./pre-action) (Tillhandahålls av pluginet @nocobase/plugin-workflow-request-interceptor)
- [Efter åtgärd](./post-action) (Tillhandahålls av pluginet @nocobase/plugin-workflow-action-trigger)
- [Anpassad åtgärd](./custom-action) (Tillhandahålls av pluginet @nocobase/plugin-workflow-custom-action-trigger)
- [Godkännande](./approval) (Tillhandahålls av pluginet @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Tillhandahålls av pluginet @nocobase/plugin-workflow-webhook)

Tidpunkten för när varje händelse triggas visas i figuren nedan:

![Arbetsflödeshändelser](https://static-docs.nocobase.com/20251029221709.png)

Till exempel, när en användare skickar in ett formulär, eller när data i en samling ändras på grund av en användaråtgärd eller ett programanrop, eller när en schemalagd uppgift når sin exekveringstid, kan ett konfigurerat arbetsflöde triggas.

Datarrelaterade triggers (som åtgärder, samlingshändelser) innehåller vanligtvis triggerns kontextdata. Denna data fungerar som variabler och kan användas av noder i arbetsflödet som behandlingsparametrar för att uppnå automatiserad databehandling. Till exempel, när en användare skickar in ett formulär, om skicka-knappen är kopplad till ett arbetsflöde, kommer det arbetsflödet att triggas och köras. Den inskickade datan kommer att injiceras i exekveringsplanens kontextmiljö för att efterföljande noder ska kunna använda den som variabler.

Efter att du har skapat ett arbetsflöde, på arbetsflödets visningssida, visas triggern som en startnod i början av processen. Genom att klicka på detta kort öppnas konfigurationspanelen. Beroende på triggertypen kan du konfigurera dess relevanta villkor.

![Trigger_Startnod](https://static-docs.nocobase.com/20251029222231.png)