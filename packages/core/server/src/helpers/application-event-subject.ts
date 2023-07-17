import { Subject, debounce, delayWhen, interval, map } from 'rxjs';
import Application from '../application';

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
          return value;
        }),
        debounce((value) => interval(this.debounceInterval)),
        delayWhen((value) => {
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
