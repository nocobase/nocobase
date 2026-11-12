---
"@nocobase/app-plugin-users": minor
"@nocobase/app-plugin-projects": minor
---

Invitation emails are written in one language instead of every supported language. The language is chosen when inviting (`locale` on the invite endpoints, defaulting to the inviter's interface language and then the application's default), kept on the invitation and reused by resends. Only a language without email text falls back to the application's default language and English. The subject follows the email's language, and the expiry is formatted for that language and marked as UTC.

The accept page opens in the invitation's language, offers a language picker, and stores the language on screen as the new account's language. Lookups return the invitation's `locale`, and accepting takes an optional `locale`. Projects' invite dialog gains an email language field. The notification template preview now renders each language separately. Traditional Chinese and Japanese wording and list separators are corrected.

This adds the migration `202611110001_user_invitation_locale`, which adds a nullable `userInvitations.locale` column. Existing invitations keep a null language and use the resending person's language.
