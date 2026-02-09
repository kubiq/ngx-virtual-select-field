import { InjectionToken, Signal } from '@angular/core';

export interface NgxVirtualSelectFieldOptionParent {
  multiple?: boolean;
  maxSelectedItems?: number;
  isMaxSelected?: Signal<boolean>;
  isOptionSelected?(value: unknown): boolean;
}

export const NGX_VIRTUAL_SELECT_FIELD_OPTION_PARENT =
  new InjectionToken<NgxVirtualSelectFieldOptionParent>(
    'NGX_VIRTUAL_SELECT_FIELD_OPTION_PARENT'
  );
