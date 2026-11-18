/** Tracks complete invitation operations, including post-submission delivery bookkeeping. */
export class InvitationWork {
  private readonly active = new Set<Promise<unknown>>();
  private stopped = false;

  public run<T>(work: () => Promise<T>): Promise<T> {
    if (this.stopped)
      return Promise.reject(new Error('Invitation delivery is stopping.'));
    const completion = Promise.resolve().then(work);
    this.active.add(completion);
    const cleanup = (): void => {
      this.active.delete(completion);
    };
    void completion.then(cleanup, cleanup);
    return completion;
  }

  public stop(): void {
    this.stopped = true;
  }

  /** Observe complete invitation operations, including delivery bookkeeping. */
  public async wait(): Promise<void> {
    while (this.active.size) {
      await Promise.allSettled([...this.active]);
    }
  }
}
