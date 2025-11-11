export interface NgxVirtualSelectFieldConfig {
  /**
   * CSS class to add to the overlay element
   */
  overlayPanelClass?: string | string[];

  /**
   * Width for overlay panel
   */
  panelWidth?: string | number;

  /**
   * Height for an option element
   */
  optionHeight?: number;

  /**
   * Amount of visible items in list
   */
  panelViewportPageSize?: number;

  /**
   * Show select all checkbox when multiple selection is enabled and filterable is true
   * @default true
   */
  showSelectAll?: boolean;
}
