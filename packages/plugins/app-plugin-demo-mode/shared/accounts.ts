/** A system account a visitor may enter in Demo Mode without typing its password. */
export interface DemoSignInAccount {
  readonly username: string;
  readonly name: string;
  readonly role: string;
  /** Whether the request is signed in as this account. */
  readonly current: boolean;
}
