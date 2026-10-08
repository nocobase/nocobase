/** Tracks work from admission through completion, including direct runtime calls. */
export class MailBackgroundTasks {
  private readonly pending = new Set<Promise<unknown>>();
  private closed = false;

  public run<T>(task: () => Promise<T>, closedResult: T): Promise<T> {
    if (this.closed) return Promise.resolve(closedResult);
    const promise = Promise.resolve().then(task);
    this.pending.add(promise);
    void promise.then(
      () => this.pending.delete(promise),
      () => this.pending.delete(promise),
    );
    return promise;
  }

  public async close(): Promise<void> {
    this.closed = true;
    await Promise.allSettled([...this.pending]);
  }
}
