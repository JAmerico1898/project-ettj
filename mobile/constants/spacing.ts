/**
 * Consistent spacing scale for the ETTJ mobile app
 * Based on an 8-point grid system
 */

/**
 * Base spacing unit (8px)
 */
export const SPACING_UNIT = 8;

/**
 * Spacing scale values
 */
export const SPACING = {
  /** 0px */
  none: 0,
  /** 4px - Extra small spacing */
  xs: SPACING_UNIT / 2,
  /** 8px - Small spacing */
  sm: SPACING_UNIT,
  /** 12px - Medium-small spacing */
  md: SPACING_UNIT * 1.5,
  /** 16px - Medium spacing (standard) */
  lg: SPACING_UNIT * 2,
  /** 24px - Large spacing */
  xl: SPACING_UNIT * 3,
  /** 32px - Extra large spacing */
  xxl: SPACING_UNIT * 4,
  /** 48px - Huge spacing */
  xxxl: SPACING_UNIT * 6,
} as const;

/**
 * Component-specific spacing
 */
export const COMPONENT_SPACING = {
  /** Padding inside cards */
  cardPadding: SPACING.lg,
  /** Gap between cards */
  cardGap: SPACING.sm,
  /** Screen edge padding */
  screenPadding: SPACING.lg,
  /** Section spacing */
  sectionGap: SPACING.xl,
  /** Button padding horizontal */
  buttonPaddingH: SPACING.lg,
  /** Button padding vertical */
  buttonPaddingV: SPACING.sm,
  /** Input field margin bottom */
  inputMarginBottom: SPACING.sm,
  /** List item padding */
  listItemPadding: SPACING.md,
  /** Icon margin */
  iconMargin: SPACING.sm,
  /** Header padding */
  headerPadding: SPACING.lg,
  /** Footer padding */
  footerPadding: SPACING.xl,
} as const;

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  /** 0px - No radius */
  none: 0,
  /** 4px - Small radius */
  sm: 4,
  /** 8px - Medium radius */
  md: 8,
  /** 12px - Large radius */
  lg: 12,
  /** 16px - Extra large radius */
  xl: 16,
  /** 9999px - Full/pill radius */
  full: 9999,
} as const;

/**
 * Common layout dimensions
 */
export const DIMENSIONS = {
  /** Standard button height */
  buttonHeight: 48,
  /** Small button height */
  buttonHeightSmall: 36,
  /** Input field height */
  inputHeight: 56,
  /** Header height */
  headerHeight: 56,
  /** Tab bar height */
  tabBarHeight: 64,
  /** Minimum touch target size */
  touchTargetMin: 44,
  /** Icon sizes */
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  /** Chart height */
  chartHeight: 220,
  /** Table row height */
  tableRowHeight: 48,
} as const;

/**
 * Z-index values for layering
 */
export const Z_INDEX = {
  /** Base layer */
  base: 0,
  /** Cards and surfaces */
  card: 1,
  /** Sticky headers */
  sticky: 10,
  /** Dropdowns and popovers */
  dropdown: 100,
  /** Modal backdrop */
  modalBackdrop: 500,
  /** Modal content */
  modal: 501,
  /** Toast notifications */
  toast: 1000,
  /** Loading overlay */
  overlay: 1001,
} as const;

/**
 * Helper to create margin object
 */
export function margin(
  top: number = 0,
  right: number = top,
  bottom: number = top,
  left: number = right
) {
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  };
}

/**
 * Helper to create padding object
 */
export function padding(
  top: number = 0,
  right: number = top,
  bottom: number = top,
  left: number = right
) {
  return {
    paddingTop: top,
    paddingRight: right,
    paddingBottom: bottom,
    paddingLeft: left,
  };
}

/**
 * Helper to create symmetric spacing
 */
export function symmetric(horizontal: number = 0, vertical: number = 0) {
  return {
    paddingHorizontal: horizontal,
    paddingVertical: vertical,
  };
}

export type SpacingKey = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
