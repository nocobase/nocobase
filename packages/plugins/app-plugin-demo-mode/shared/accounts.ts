/** A display title owned by a Permission Set's client namespace, with a stable fallback for other consumers. */
export type DemoAccountRoleTitle =
  | string
  | {
      readonly key: string;
      readonly ns: string;
      readonly defaultValue: string;
    };

/** A system account a visitor may enter in Demo Mode without typing its password. */
export interface DemoSignInAccount {
  readonly username: string;
  readonly name: string;
  /** Dataset label, or plain Permission Set titles and keys. The client hook localizes this field for display. */
  readonly role: string;
  /** Present only when falling back to directly assigned visible Permission Sets; translated by the client. */
  readonly roleTitles?: readonly DemoAccountRoleTitle[];
  /** Whether the request is signed in as this account. */
  readonly current: boolean;
}
