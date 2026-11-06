---
"@nocobase/app-template-examples": patch
---

The installed agent chat follows the UI Library's `agent-chat` and `agent-composer`: the panel switches between the Online agent and Runner agents when both are configured, each with its own history; full width lists the conversations in a column on the left and returns to the side panel when the navigation changes the page; the history ends with an Archived toggle and says it is empty in one line; context chips open a preview of what they carry; the panel takes the focus as it opens; and a new conversation starts with the agent the person used last (`ChatProvider memoryScope`). The new-conversation picker offers only the current mode's choices, models for the Online agent and agents for Runner, in place of one mixed list. An application generated earlier keeps its installed copy; reinstall the items or merge these files to follow.
