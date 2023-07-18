import { Subject, bufferTime, delayWhen, distinct, interval, map, mergeMap } from 'rxjs';
import Application from '../application';

import { hasher } from 'node-object-hash';

const objectHasher = hasher({});

interface EventObject {
  name: string;
  options: any;
}

export class ApplicationEventSubject {
  private events: Subject<EventObject> = new Subject();

  debounceInterval = 100;

  constructor(app: Application) {
    this.initEvents(app);
    app.on('beforeDestroy', () => {
      this.events.complete();
    });
  }

  initEvents(app: Application) {
    this.events
      .pipe(
        map((value) => {
          return {
            ...value,
            __$hash: objectHasher.hash(value),
          };
        }),
        bufferTime(this.debounceInterval),
        mergeMap((x) => x),
        distinct((e) => e.__$hash),
        delayWhen((value: EventObject) => {
          const options = value.options;
          if (options && options.__$delay) {
            return interval(options.__$delay);
          }

          return interval(0);
        }),
      )
      .subscribe({
        next: (event) => {
          app.emit(`rpc:${event.name}`, event.options);
        },
      });
  }

  push(name: string, options: any) {
    this.events.next({ name, options });
  }
}
