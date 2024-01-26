export default {
  syncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
    sync = true;
  },
  asyncTrigger: class {
    constructor(public readonly workflow) {}
    on() {}
    off() {}
  },
};
