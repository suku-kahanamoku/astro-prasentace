/**
 * Sdílené datové typy UIModule.
 *
 * Moduly SiteModule a UIModule si vyměňují jen data, ne implementaci,
 * aby UIModule zůstalo nezávislým základem bez importů z ostatních modulů.
 */

/** Jedna položka navigace typu „drobečková cesta“. */
export interface Breadcrumb {
  /** Název položky v jazyce stránky. */
  name: string;
  /** Odkaz na předchozí úroveň; poslední položka odkaz nepotřebuje. */
  href: string;
}

/** Jedna položka vodorovné navigace v hlavičce. */
export interface NavigationItem {
  /** URL cílové stránky, sestavená přes `url()` z `src/config/routes`. */
  href: string;
  /** Text položky v jazyce stránky. */
  label: string;
  /** Zda položka odpovídá aktuální stránce; přidá třídu `active` a `aria-current`. */
  current?: boolean;
}
