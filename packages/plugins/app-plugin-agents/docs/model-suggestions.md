# Runner model suggestions

The runner Agent editor combines `TOOL_MODEL_SUGGESTIONS` with model capabilities in the viewer's existing runner list. Tool capabilities are optional, so an older server or runner keeps the built-in suggestions and free-text model input. The editor never requests machine paths, credentials or another user's hidden runners.

Each reported tool may carry `models: [{ id, efforts? }]` and `modelsDetectionStatus`. Reports with an explicit status other than `detected` contribute no models. Model IDs are matched exactly: `openai/model` and `another-provider/model` remain separate. A model appearing in both sources has one suggestion and retains its built-in marker. Reporters are deduplicated by runner ID.

The suggestion's count includes reporters that are online, have the tool enabled and report it authenticated. A busy runner can still support the model; this count does not promise a free slot, permission, account quota or successful execution. Offline, revoked, disabled or signed-out reporters retain their suggestions but are marked not ready in the name tooltip. Built-in models with no report have no availability assertion.

Reported reasoning efforts are combined across reporters. The editor offers the reported efforts that the Agent configuration currently accepts for the tool; its hint displays the complete report. An absent report falls back to the tool's effort list; an explicitly empty report offers only the default. An existing saved effort remains visible even when no reporter lists it, with a prompt to review it. Selecting a model, refreshing reports or changing readiness never silently resets the effort.

Reports only inform editing. They do not update Agent configuration until the person saves the form. Applications using the plugin's Agent pages receive this behavior with the plugin update. An application maintaining a copied editor must merge the editor and locale changes explicitly and pass only its authorized runner list. End-to-end verification requires a server that retains the capability fields and an updated runner that reports them; a UI fixture alone does not establish real account access.
