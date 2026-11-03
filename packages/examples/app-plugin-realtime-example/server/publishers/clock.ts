export const CLOCK_TOPIC: string = 'clock:now';

export interface ClockPublisherRealtime {
  publish(topic: string, payload: unknown): Promise<unknown>;
  subscriptionCount(topic: string): number;
  onTopicSubscriptionChange(
    topic: string,
    listener: (count: number) => void,
  ): () => void;
}

export interface ClockPublisherOptions {
  intervalMs?: number;
}

export function startClockPublisher(
  realtime: ClockPublisherRealtime,
  options: ClockPublisherOptions = {},
): () => void {
  const intervalMs = options.intervalMs ?? 200;
  let interval: NodeJS.Timeout | undefined;

  const start = (): void => {
    if (interval) {
      return;
    }

    interval = setInterval(() => {
      void realtime
        .publish(CLOCK_TOPIC, new Date().toString())
        .catch((error: unknown) =>
          console.error('Clock realtime announcement failed.', error),
        );
    }, intervalMs);
    interval.unref();
  };

  const stop = (): void => {
    if (!interval) {
      return;
    }

    clearInterval(interval);
    interval = undefined;
  };

  const unsubscribe = realtime.onTopicSubscriptionChange(
    CLOCK_TOPIC,
    (count) => {
      if (count > 0) {
        start();
        return;
      }

      stop();
    },
  );

  if (realtime.subscriptionCount(CLOCK_TOPIC) > 0) {
    start();
  }

  return () => {
    unsubscribe();
    stop();
  };
}
