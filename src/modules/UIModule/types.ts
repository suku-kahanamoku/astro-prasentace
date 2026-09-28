export interface Breadcrumb {
  name: string;
  href: string;
}

export interface NavigationItem {
  href: string;
  label: string;
  current?: boolean;
}
