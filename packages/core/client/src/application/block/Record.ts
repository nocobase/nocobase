export interface RecordOptions<CurrentType = {}, ParentType = {}> {
  current: CurrentType;
  parent?: ParentType;
  isNew?: boolean;
}

export class RecordV2<CurrentType = {}, ParentType = {}> {
  public current: CurrentType;
  public parent?: RecordV2<ParentType>;
  public isNew = false;
  constructor(options: RecordOptions<CurrentType, RecordV2<ParentType>>) {
    const { current, parent, isNew } = options;
    this.current = current;
    this.parent = parent;
    this.isNew = isNew;
  }

  changeState() {
    this.isNew = false;
  }

  setParent(parent: RecordV2<ParentType>) {
    this.parent = parent;
  }
}
