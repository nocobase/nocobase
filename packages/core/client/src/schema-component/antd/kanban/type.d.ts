interface IGroupField {
  name: string;
  enum: Array<{ label: string; value: string; color?: string; }>;
}

interface IBoard {
  columns: Array<any>;
}

type ComposedKanban = React.FC<any> & {
  Card?: React.FC<any> & {
    Designer?: React.FC<any>;
  };
  CardAdder?: React.FC<any>;
  CardViewer?: React.FC<any>;
  Designer?: React.FC<any>;
};
