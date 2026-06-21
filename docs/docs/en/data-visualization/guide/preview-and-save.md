# Preview and Save

- Preview: Temporarily render changes from the configuration panel into the page chart to verify the result.
- Save: Persist changes from the configuration panel to the database.

## Entry points


![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)


- In visual (Basic) mode, changes are applied to the preview automatically by default.
- In SQL and Custom modes, click the Preview button on the right to apply changes to the preview.
- A unified Preview button is available at the bottom of the configuration panel.

## Preview behavior
- Temporarily displays the configuration on the page without writing to the database. After a refresh or cancel, the preview result is not retained.
- Built‑in debounce: multiple refresh triggers in a short time only execute the latest one to avoid frequent requests.
- Clicking Preview again overwrites the last preview result.

## Error messages
- Query errors or validation failures: shown in the View data area.
- Chart configuration errors (missing Basic mapping, exceptions from Custom JS): shown in the chart area or console while keeping the page operable.
- Confirm column names and data types in View data before field mapping or writing Custom code to reduce errors.

## Save and Cancel
- Save: write current changes into the block configuration and apply them to the page immediately.
- Cancel: discard current unsaved changes and revert to the last saved state.
- Save scope:
  - Data query: Builder parameters; in SQL mode, the SQL text is saved as well.
  - Chart options: Basic type, field mapping, and properties; Custom JS text.
  - Interaction events: JS text and binding logic.
- After saving, the block takes effect for all visitors (subject to page permissions).

## Recommended flow
- Configure data query → Run query → View data to confirm column names and types → Configure chart options to map core fields → Preview to validate → Save to apply.