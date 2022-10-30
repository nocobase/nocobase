export interface ToolbarProps {
  localizer?: any;
  label?: any;
  view?: any;
  views?: any;
  onNavigate?: (action: string) => void;
  onView?: (view: string) => void;

  date: string;
  /**
   * 是否展示农历
   */
  showLunar: boolean;
}
