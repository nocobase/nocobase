import { Subject, delayWhen, interval, map } from 'rxjs';
import Application from '../application';

import { hasher } from 'node-object-hash';

const objectHasher = hasher({});

interface EventObject {
  name: string;
  options: any;
}

export class ApplicationEventSubject {
  private events: Subject<EventObject> = new Subject();

  debounceInterval = 200;

  constructor(app: Application) {
    this.initEvents(app);
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
        delayWhen((value) => {
          console.log({ value });
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
