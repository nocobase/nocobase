// The selected entry uses the theme's `--sidebar-primary` pair (`theme.md`), where shadcn's menu buttons use the
// hover color; the class is passed in, the primitive stays unchanged. Shared by every sidebar menu of the application.
export const SELECTED =
  'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground';
