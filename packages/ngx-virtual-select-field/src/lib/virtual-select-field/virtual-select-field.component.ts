//#region imports

import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  QueryList,
  Signal,
  TrackByFunction,
  ViewChild,
  booleanAttribute,
  computed,
  inject,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ListKeyManager } from '@angular/cdk/a11y';
import {
  CdkConnectedOverlay,
  CdkOverlayOrigin,
  OverlayModule,
  ViewportRuler,
} from '@angular/cdk/overlay';
import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  MAT_FORM_FIELD,
  MatFormField,
  MatFormFieldControl,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { hasModifierKey } from '@angular/cdk/keycodes';
import {
  Observable,
  Subject,
  debounceTime,
  map,
  merge,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';

import {
  NgxVirtualSelectFieldOptionForDirective,
  NgxVirtualSelectFieldOptionModel,
} from './virtual-select-field-option-for';
import {
  NGX_VIRTUAL_SELECT_FIELD_TRIGGER,
  NgxVirtualSelectFieldTriggerDirective,
} from './virtual-select-field-trigger';
import {
  NGX_VIRTUAL_SELECT_FIELD_OPTION_PARENT,
  NgxVirtualSelectFieldOptionComponent,
  NgxVirtualSelectFieldOptionParent,
  NgxVirtualSelectFieldOptionSelectionChangeEvent,
} from './virtual-select-field-option';

import {
  OPTION_HEIGHT,
  PANEL_WIDTH_AUTO,
  POSITIONS,
  PANEL_VIEWPORT_PAGE_SIZE,
  NGX_VIRTUAL_SELECT_FIELD_CONFIG,
} from './virtual-select-field.constants';
import { NgxVirtualSelectFieldConfig } from './virtual-select-field.models';
import {
  ARROW_DOWN_KEY,
  ARROW_LEFT_KEY,
  ARROW_RIGHT_KEY,
  ARROW_UP_KEY,
  ENTER_CODE,
  KEY_A_CODE,
  SPACE_CODE,
} from './keycodes';
import { MatPseudoCheckboxModule } from '@angular/material/core';

//#endregion imports

@Component({
  selector: 'ngx-virtual-select-field',
  exportAs: 'ngxVirtualSelectField',
  standalone: true,
  imports: [
    CommonModule,
    OverlayModule,
    ScrollingModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatPseudoCheckboxModule,
  ],
  templateUrl: './virtual-select-field.component.html',
  styleUrl: './virtual-select-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: NgxVirtualSelectFieldComponent,
    },
    {
      provide: NGX_VIRTUAL_SELECT_FIELD_OPTION_PARENT,
      useExisting: NgxVirtualSelectFieldComponent,
    },
  ],
  host: {
    '[attr.tabindex]': 'this.disabled ? -1 : tabIndex',
    '(focus)': 'onFocusIn()',
    '(blur)': 'onFocusOut()',
    '(keydown)': 'onKeyDown($event)',
    class: 'ngx-virtual-select-field',
    '[class.ngx-virtual-select-field-disabled]': 'disabled',
    '[class.ngx-virtual-select-field-invalid]': 'errorState',
  },
})
export class NgxVirtualSelectFieldComponent<TValue>
  implements
    OnInit,
    OnDestroy,
    AfterContentInit,
    MatFormFieldControl<TValue[] | TValue>,
    ControlValueAccessor,
    NgxVirtualSelectFieldOptionParent
{
  //#region Inputs/Outputs

  @Input('aria-describedby')
  userAriaDescribedBy = '';

  /**
   * Width for overlay panel
   * @default 'auto'
   */
  @Input()
  panelWidth: string | number | null =
    this._defaultOptions?.panelWidth ?? PANEL_WIDTH_AUTO;

  /**
   * Height for an option element
   * @default 48
   */
  @Input({
    transform: (value: unknown) => numberAttribute(value, OPTION_HEIGHT),
  })
  optionHeight: number = this._defaultOptions?.optionHeight ?? OPTION_HEIGHT;

  /**
   * Amount of visible items in list
   * @default 8
   */
  @Input({
    transform: (value: unknown) =>
      numberAttribute(value, PANEL_VIEWPORT_PAGE_SIZE),
  })
  panelViewportPageSize: number =
    this._defaultOptions?.panelViewportPageSize ?? PANEL_VIEWPORT_PAGE_SIZE;

  /**
   * Enable multiple selection
   * @default false
   */
  @Input({ transform: booleanAttribute })
  multiple: boolean = false;

  /**
   * Tab index for keyboard navigation
   * @default 0
   */
  @Input({
    transform: (value: unknown) => numberAttribute(value, 0),
  })
  tabIndex: number = 0;

  /**
   * Milliseconds to wait before navigating to active element after keyboard search
   * @default 300
   */
  @Input({ transform: numberAttribute })
  typeaheadDebounceInterval: number = 300;

  /**
   * CSS class to be added to the panel element
   * @default none
   */
  @Input()
  panelClass: string | string[] | null = null;

  /**
   * Enable filtering of options
   * @default false
   */
  @Input({ transform: booleanAttribute })
  filterable: boolean = false;

  /**
   * Placeholder text for the filter input
   * @default 'Search...'
   */
  @Input()
  filterPlaceholder: string = 'Search...';

  /**
   * Show clear button in filter input
   * @default true
   */
  @Input({ transform: booleanAttribute })
  filterClearable: boolean = true;

  /**
   * Show clear button in select trigger
   * @default false
   */
  @Input({ transform: booleanAttribute })
  clearable: boolean = false;

  /**
   * Show loading spinner
   * @default false
   */
  @Input({ transform: booleanAttribute })
  loading: boolean = false;

  /**
   * Show select all checkbox when multiple selection is enabled and filterable is true
   * @default true
   */
  @Input({ transform: booleanAttribute })
  showSelectAll: boolean = this._defaultOptions?.showSelectAll ?? true;

  /**
   * Maximum number of items that can be selected (only applies when multiple is true)
   * @default null (no limit)
   */
  @Input({
    transform: (value: unknown) => numberAttribute(value, 0),
  })
  maxSelectedItems: number = 0;

  /**
   * Value of the select field
   * @default null
   */
  @Input()
  set value(value: TValue[] | TValue | null) {
    if (this._value === value) {
      return;
    }

    value = value || [];

    if (!Array.isArray(value)) {
      value = [value];
    }

    this._value = value;

    this._selectionModel?.setSelection(
      ...this._value.map(
        (v) => this.optionFor.options$.value.find((o) => o.value === v)!,
      ),
    );

    // Update selection count signal for reactivity
    this.selectedCount.set(this._value.length);

    this._stateChanges.next();
  }
  private _value: TValue[] = [];

  /**
   * Placeholder for the select field
   * @default none
   */
  @Input()
  set placeholder(placeholder: string) {
    this._placeholder = placeholder;
    this._stateChanges.next();
  }

  get placeholder(): string {
    return this._placeholder;
  }

  private _placeholder = '';

  /**
   * Define if fields is required
   * @default false
   */
  @Input({ transform: booleanAttribute })
  set required(req: boolean) {
    this._required = req;
    this._stateChanges.next();
  }

  get required(): boolean {
    return this._required;
  }

  private _required = false;

  /**
   * Define if field is disabled
   * @default false
   */
  @Input({ transform: booleanAttribute })
  set disabled(value: boolean) {
    this._disabled = value;
    this._stateChanges.next();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  private _disabled = false;

  /**
   * Value change event
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valueChange = output<any>();

  /**
   * Selection change event
   * Emits after value change and form control update
   */
  selectionChange = output<NgxVirtualSelectFieldChange<TValue>>();

  //#endregion Inputs/Outputs

  @ViewChild(CdkVirtualScrollViewport, { static: false })
  cdkVirtualScrollViewport!: CdkVirtualScrollViewport;

  @ViewChild(CdkConnectedOverlay, { static: false })
  cdkConnectedOverlay!: CdkConnectedOverlay;

  @ViewChild('filterInput', { static: false })
  filterInput: ElementRef<HTMLInputElement> | undefined;

  @ContentChild(NgxVirtualSelectFieldOptionForDirective)
  optionFor!: NgxVirtualSelectFieldOptionForDirective<TValue>;

  @ContentChild(NGX_VIRTUAL_SELECT_FIELD_TRIGGER)
  customTrigger: NgxVirtualSelectFieldTriggerDirective | null = null;

  @ContentChildren(NgxVirtualSelectFieldOptionComponent)
  optionsQuery: QueryList<NgxVirtualSelectFieldOptionComponent<TValue>> | null =
    null;

  readonly id = `ngx-virtual-select-field-${NgxVirtualSelectFieldComponent.nextId++}`;
  readonly controlType = 'ngx-virtual-select-field';
  readonly ngControl: NgControl | null = inject(NgControl, {
    optional: true,
  });
  autofilled = false;

  protected readonly POSITIONS = POSITIONS;
  protected readonly overlayPanelClass: string | string[] =
    this._defaultOptions?.overlayPanelClass || '';
  protected readonly inheritedColorTheme: string;
  protected readonly overlayWidth: Signal<string | number>;

  protected readonly isPanelOpened = signal(false);
  protected readonly filterText = signal('');
  protected readonly options = signal<
    NgxVirtualSelectFieldOptionModel<TValue>[]
  >([]);
  protected readonly filteredOptions = computed(() => {
    const searchText = this.filterText().toLowerCase().trim();
    const allOptions = this.options();

    if (!searchText || !this.filterable) {
      return allOptions;
    }

    return allOptions.filter((option) => {
      const label = option.getLabel?.() ?? option.label;
      return label.toLowerCase().includes(searchText);
    });
  });

  protected readonly hasOptionsToFilter = computed(
    () => this.options().length > 1,
  );
  protected readonly hasNoFilteredResults = computed(() => {
    const filtered = this.filteredOptions();
    const hasFilter = this.filterText().trim().length > 0;
    return hasFilter && filtered.length === 0 && this.options().length > 0;
  });

  /**
   * Track selection count as a signal so computed properties react to changes
   */
  private readonly selectedCount = signal(0);

  /**
   * Check if max selection limit is reached
   * Public so option components can access it via the parent interface
   */
  readonly isMaxSelected = computed(() => {
    if (!this.maxSelectedItems) {
      return false;
    }
    return this.selectedCount() >= this.maxSelectedItems;
  });

  protected triggerValue$: Observable<string> | null = null;
  protected preferredOverlayOrigin: CdkOverlayOrigin | ElementRef | undefined;

  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _elRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly _stateChanges = new Subject<void>();
  private readonly _scrolledIndexChange = new Subject<void>();

  private _onChange: (value: TValue[] | TValue) => void = () => void 0;
  private _onTouched: () => void = () => void 0;

  private _selectionModel!: SelectionModel<
    NgxVirtualSelectFieldOptionModel<TValue>
  >;
  private _keyManager: ListKeyManager<
    NgxVirtualSelectFieldOptionModel<TValue>
  > | null = null;

  constructor(
    @Optional()
    @Inject(MAT_FORM_FIELD)
    private _parentFormField: MatFormField,
    @Optional()
    @Inject(NGX_VIRTUAL_SELECT_FIELD_CONFIG)
    private _defaultOptions?: NgxVirtualSelectFieldConfig,
  ) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
      this._disabled = this.ngControl.disabled ?? false;
    }

    this.overlayWidth = this.createOverlayWidthSignal();

    this.inheritedColorTheme = this._parentFormField
      ? `mat-${this._parentFormField.color}`
      : '';

    // NOTE: Key manager is now updated explicitly in onFilterInput() instead of via effect.
    // The previous effect caused infinite loops because:
    // 1. open() called initListKeyManager() then isPanelOpened.set(true)
    // 2. Setting isPanelOpened triggered the effect
    // 3. Effect called initListKeyManager() again
    // 4. This created cascading updates that froze the browser
  }

  private createOverlayWidthSignal() {
    const changeDetectorRef = inject(ChangeDetectorRef);

    // NOTE: View port ruler change stream runs outside the zone.
    //       Need to run change detection manually to trigger computed signal below.
    const viewPortRulerChange = toSignal(
      inject(ViewportRuler)
        .change()
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          tap(() => changeDetectorRef.detectChanges()),
        ),
    );

    return computed(() => {
      viewPortRulerChange();

      return this.resolveOverlayWidth(this.preferredOverlayOrigin);
    });
  }

  private resolveOverlayWidth(
    preferredOrigin: ElementRef<ElementRef> | CdkOverlayOrigin | undefined,
  ): string | number {
    if (!this.isPanelOpened()) {
      return 0;
    }

    if (this.panelWidth !== PANEL_WIDTH_AUTO) {
      return this.panelWidth ?? '';
    }

    const refToMeasure =
      preferredOrigin instanceof CdkOverlayOrigin
        ? preferredOrigin.elementRef
        : preferredOrigin || this._elRef;

    return refToMeasure.nativeElement.getBoundingClientRect().width;
  }

  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  get empty() {
    return !this._selectionModel || this._selectionModel.isEmpty();
  }

  get stateChanges(): Observable<void> {
    return this._stateChanges.asObservable();
  }

  get errorState(): boolean {
    return !!this.ngControl?.invalid && !!this.ngControl?.touched;
  }

  get focused(): boolean {
    // NOTE: panel open is needed to keep form field in focused state during interaction with options
    return this._focused || this.isPanelOpened();
  }
  private _focused = false;

  protected get maxPageSize(): number {
    return Math.min(
      this.panelViewportPageSize,
      this.optionFor.options$.value.length,
    );
  }

  ngOnInit() {
    this._selectionModel = new SelectionModel<
      NgxVirtualSelectFieldOptionModel<TValue>
    >(this.multiple, [], true);
  }

  ngAfterContentInit() {
    this.assertIsDefined(this.optionsQuery, `optionsQuery is not defined`);

    if (!this.customTrigger) {
      this.triggerValue$ = this._selectionModel.changed.pipe(
        startWith(null),
        map((_selected) =>
          this._selectionModel.selected
            .map((option) => option?.label ?? '')
            .join(', '),
        ),
      );
    }

    // Subscribe to options$ and update the options signal
    this.optionFor.options$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((options) => {
        this.options.set(options);
        this._selectionModel?.setSelection(
          ...this._value.map((v) => options.find((o) => o.value === v)!),
        );
      });

    this.optionsQuery.changes
      .pipe(
        startWith(this.optionsQuery),
        switchMap(() =>
          merge(...this.optionsQuery!.map((option) => option.selectedChange))
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((selectionEvent) => {
        this.updateOptionSelection(selectionEvent, this.options());
      });

    merge(this._scrolledIndexChange, this._selectionModel.changed)
      .pipe(takeUntilDestroyed(this._destroyRef), debounceTime(20))
      .subscribe(() => {
        this.updateRenderedOptionsState(this.options());
      });
  }

  private updateOptionSelection(
    selectionEvent: NgxVirtualSelectFieldOptionSelectionChangeEvent<TValue>,
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
  ) {
    this.assertIsDefined(this.optionsQuery, `optionsQuery is not defined`);

    const { option: changedOption } =
      this.findOptionByValue(options, selectionEvent.value);

    if (this.multiple) {
      // Check max limit - allow deselect but prevent select if at max
      const isCurrentlySelected = this._selectionModel.isSelected(changedOption);
      if (!isCurrentlySelected && this.maxSelectedItems > 0 &&
          this._selectionModel.selected.length >= this.maxSelectedItems) {
        // Max reached, don't allow selecting more
        return;
      }
      this._selectionModel.toggle(changedOption);
    } else if (changedOption.value === null) {
      this._selectionModel.clear();
      this.close();
    } else {
      this._selectionModel.select(changedOption);
      this.close();
    }

    // Use filteredOptions index for key manager since it's initialized with filtered list
    // Only set active item when panel is open (for multiple select after selection)
    if (this.isPanelOpened() && this._selectionModel.isSelected(changedOption)) {
      const filteredIndex = this.filteredOptions().findIndex(
        (o) => o.value === changedOption.value,
      );
      if (filteredIndex >= 0) {
        this._keyManager?.setActiveItem(filteredIndex);
      }
    }

    // NOTE: this need to keep form field in focus state
    this.focus();
    this.emitValue();
  }

  ngOnDestroy() {
    this._scrolledIndexChange.complete();
    this._keyManager?.destroy();
    this._stateChanges.complete();
  }

  // #region ControlValueAccessor

  writeValue(value: TValue[]): void {
    this.value = value;

    // after settting a value on empty fornControl local `empty` does not update
    // as result the field continue to show placeholder.
    // needed to trigger change detection for the empty state and trigger value updates
    this._changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: TValue[] | TValue) => void) {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // #endregion ControlValueAccessor

  setDescribedByIds(ids: string[]) {
    const controlElement = this._elRef.nativeElement;

    controlElement.setAttribute('aria-describedby', ids.join(' '));
  }

  onContainerClick(): void {
    if (this.disabled) {
      return;
    }

    this.focus();
    this.open();
  }

  onOverlayAttached() {
    // Focus the filter input when overlay is attached
    if (this.filterable && this.hasOptionsToFilter()) {
      setTimeout(() => {
        this.filterInput?.nativeElement.focus();
      }, 100);
    }

    this.cdkConnectedOverlay.positionChange
      .pipe(
        take(1),
        switchMap(() => this._scrolledIndexChange.pipe(take(1))),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => this.navigateToFirstSelectedOption());
  }

  private navigateToFirstSelectedOption() {
    if (this._selectionModel.isEmpty()) {
      return;
    }

    let targetIndex = this.optionFor.options$.value.findIndex(
      (option) => option === this._selectionModel.selected[0],
    );

    targetIndex = targetIndex - this.maxPageSize / 2;
    targetIndex = Math.max(0, targetIndex);

    this.cdkVirtualScrollViewport.scrollToIndex(targetIndex);
  }

  protected onFocusIn() {
    if (!this.focused) {
      this._focused = true;
      this._stateChanges.next();
    }
  }

  protected onFocusOut() {
    this._focused = false;

    if (!this.isPanelOpened()) {
      this._onTouched();
      this._stateChanges.next();
    }
  }

  protected optionTrackBy: TrackByFunction<
    NgxVirtualSelectFieldOptionModel<TValue>
  > = (_index: number, option) => {
    return option.value;
  };

  protected onScrolledIndexChange(): void {
    this._scrolledIndexChange.next();
  }

  protected onFilterInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filterText.set(input.value);

    // Update key manager with new filtered options
    // This replaces the previous effect-based approach which caused infinite loops
    if (this._keyManager && this.isPanelOpened()) {
      this.initListKeyManager(this.filteredOptions());
    }
  }

  protected onFilterClear(): void {
    this.filterText.set('');

    // Update key manager with all options (filter cleared)
    if (this._keyManager && this.isPanelOpened()) {
      this.initListKeyManager(this.filteredOptions());
    }

    // Re-focus the filter input after clearing
    setTimeout(() => {
      this.filterInput?.nativeElement.focus();
    }, 0);
  }

  protected onClear(event: Event): void {
    event.stopPropagation(); // Prevent opening the panel
    this._selectionModel.clear();
    this.emitValue();
  }

  protected isAllSelected(): boolean {
    if (!this._selectionModel) {
      return false;
    }

    // When filter is active, check against filtered options
    const optionsToCheck = this.hasActiveFilter()
      ? this.filteredOptions()
      : this.options();
    const enabledOptions = optionsToCheck.filter((option) => !option.disabled);

    if (enabledOptions.length === 0) {
      return false;
    }

    // Use Set for O(1) lookups instead of iterating selected array for each option
    const selectedValues = this.getSelectedValuesSet();
    return enabledOptions.every((option) => selectedValues.has(option.value));
  }

  protected isIndeterminate(): boolean {
    if (!this._selectionModel) {
      return false;
    }

    // When filter is active, check against filtered options
    const optionsToCheck = this.hasActiveFilter()
      ? this.filteredOptions()
      : this.options();
    const enabledOptions = optionsToCheck.filter((option) => !option.disabled);

    if (enabledOptions.length === 0) {
      return false;
    }

    // Use Set for O(1) lookups instead of iterating selected array for each option
    const selectedValues = this.getSelectedValuesSet();
    const selectedInView = enabledOptions.filter((option) =>
      selectedValues.has(option.value),
    ).length;

    return selectedInView > 0 && selectedInView < enabledOptions.length;
  }

  protected onSelectAllChange(): void {
    // When filter is active, toggle only filtered options
    const optionsToToggle = this.hasActiveFilter()
      ? this.filteredOptions()
      : this.options();
    this.toggleAllOptions(optionsToToggle);
    this.emitValue();
  }

  /**
   * Returns true if there is an active filter text
   */
  private hasActiveFilter(): boolean {
    return this.filterText().trim().length > 0;
  }

  protected onFilterKeyDown(event: KeyboardEvent): void {
    const isVerticalArrowKey =
      event.key === ARROW_DOWN_KEY || event.key === ARROW_UP_KEY;

    // Arrow down/up should always move focus to the options list
    if (isVerticalArrowKey) {
      event.preventDefault();
      this.cdkVirtualScrollViewport.elementRef.nativeElement.focus();
      this._keyManager?.onKeydown(event);
      return;
    }

    // Left/Right arrows work normally in the input for cursor movement

    // Allow other keys like Escape, Enter to work
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab') {
      // Tab should close the panel
      this.close();
    }
  }

  protected open() {
    if (this.isPanelOpened()) {
      return;
    }

    if (this._parentFormField) {
      this.preferredOverlayOrigin =
        this._parentFormField.getConnectedOverlayOrigin();
    }

    // Initialize key manager when panel opens to enable keyboard navigation
    this.initListKeyManager(this.filteredOptions());

    this.isPanelOpened.set(true);
  }

  protected close() {
    this.isPanelOpened.set(false);
    this.filterText.set(''); // Clear filter when closing
    this._onTouched();
    this._stateChanges.next();
  }

  //#region Keyboard navigation

  protected onKeyDown(event: KeyboardEvent) {
    if (this.disabled) {
      return;
    }

    if (this.isPanelOpened()) {
      this.doPanelOpenedKeydown(event);
    } else {
      this.doPanelClosedKeydown(event);
    }
  }

  private doPanelOpenedKeydown(event: KeyboardEvent) {
    this.assertIsDefined(this.optionsQuery, `optionsQuery is not defined`);

    const keyManager = this._keyManager;
    const activeItem = keyManager?.activeItem;
    const isTyping = keyManager?.isTyping();
    // Use all options for selection operations (values are unique)
    const allOptions = this.optionFor.options$.value;
    // Use filtered options for index-based operations (key manager uses filtered list)
    const keyManagerOptions = this.filteredOptions();
    const isArrowKey =
      event.key === ARROW_DOWN_KEY || event.key === ARROW_UP_KEY;

    if (isArrowKey && event.altKey) {
      event.preventDefault();

      this.close();
    } else if (
      !isTyping &&
      (event.code === ENTER_CODE || event.code === SPACE_CODE) &&
      activeItem &&
      !hasModifierKey(event)
    ) {
      event.preventDefault();

      const { option } = this.findOptionByValue(allOptions, activeItem.value);

      // Check max limit - allow deselect but prevent select if at max
      const isCurrentlySelected = this._selectionModel.isSelected(option);
      if (!isCurrentlySelected && this.maxSelectedItems > 0 &&
          this._selectionModel.selected.length >= this.maxSelectedItems) {
        // Max reached, don't allow selecting more
        return;
      }

      this._selectionModel.toggle(option);

      this.emitValue();
    } else if (
      !isTyping &&
      this.multiple &&
      event.code === KEY_A_CODE &&
      event.ctrlKey
    ) {
      event.preventDefault();

      // When filter is active, toggle only filtered options
      const optionsToToggle = this.hasActiveFilter()
        ? keyManagerOptions
        : allOptions;
      this.toggleAllOptions(optionsToToggle);

      this.emitValue();
    } else {
      const previouslyFocusedIndex = keyManager?.activeItemIndex;

      keyManager?.onKeydown(event);

      if (
        this.multiple &&
        isArrowKey &&
        event.shiftKey &&
        keyManager?.activeItem &&
        keyManager?.activeItemIndex !== previouslyFocusedIndex &&
        previouslyFocusedIndex != null
      ) {
        // Select the item we navigated FROM (the previously focused item)
        // Use keyManagerOptions since index is from the key manager (filtered list)
        const previousOption = keyManagerOptions[previouslyFocusedIndex];
        if (previousOption) {
          this.selectOptionByValue(allOptions, previousOption.value);
        }
      }
    }
  }

  private toggleAllOptions(
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
  ) {
    const enabledOptions = options.filter((option) => !option.disabled);

    // Use Set for O(1) lookups
    const selectedValues = this.getSelectedValuesSet();

    // Check if all provided options are currently selected
    const allSelected = enabledOptions.every((option) =>
      selectedValues.has(option.value),
    );

    if (allSelected) {
      // Deselect only the provided options (important for filtered selection)
      // Find matching options in selection model by value
      const valuesToDeselect = new Set(enabledOptions.map((o) => o.value));
      const optionsToDeselect = this._selectionModel.selected.filter((o) =>
        valuesToDeselect.has(o.value),
      );
      this._selectionModel.deselect(...optionsToDeselect);
    } else {
      // Select all provided options
      // Respect max limit when selecting all
      if (this.maxSelectedItems > 0) {
        const currentCount = this._selectionModel.selected.length;
        const remainingSlots = this.maxSelectedItems - currentCount;
        const notYetSelected = enabledOptions.filter(
          (option) => !selectedValues.has(option.value),
        );
        const toSelect = notYetSelected.slice(0, remainingSlots);
        this._selectionModel.select(...toSelect);
      } else {
        // Filter out already selected to avoid duplicates
        const notYetSelected = enabledOptions.filter(
          (option) => !selectedValues.has(option.value),
        );
        this._selectionModel.select(...notYetSelected);
      }
    }
  }

  private doPanelClosedKeydown(event: KeyboardEvent): void {
    // Ensure key manager is initialized for keyboard navigation when panel is closed
    if (!this._keyManager) {
      this.initListKeyManager(this.filteredOptions());
    }

    const keyManager = this._keyManager;
    const isTyping = keyManager?.isTyping();

    const isArrowKey =
      event.key === ARROW_DOWN_KEY ||
      event.key === ARROW_UP_KEY ||
      event.key === ARROW_RIGHT_KEY ||
      event.key === ARROW_LEFT_KEY;

    if (
      (!isTyping &&
        (event.code === SPACE_CODE || event.code === ENTER_CODE) &&
        !hasModifierKey(event)) ||
      ((this.multiple || event.altKey) && isArrowKey)
    ) {
      event.preventDefault(); // prevents the page from scrolling down when pressing space
      this.open();
    } else if (!this.multiple) {
      const previouslySelectedOptionIndex = keyManager?.activeItemIndex;

      keyManager?.onKeydown(event);
      const selectedOptionIndex = keyManager?.activeItemIndex;

      if (
        selectedOptionIndex &&
        previouslySelectedOptionIndex !== selectedOptionIndex
      ) {
        //TODO: arrow navigation should start from selected options. Currently it starts from the first option
        if (keyManager.activeItem) {
          this.selectOptionByValue(
            this.optionFor.options$.value,
            keyManager.activeItem.value,
          );
        }

        // TODO: Add live announcer
        // We set a duration on the live announcement, because we want the live element to be
        // cleared after a while so that users can't navigate to it using the arrow keys.
        // this._liveAnnouncer.announce((selectedOption as MatOption).viewValue, 10000);
      }
    }
  }

  //#endregion Keyboard navigation

  //#region Key manager

  private initListKeyManager(
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
  ) {
    this._keyManager?.destroy();

    this._keyManager = new ListKeyManager<
      NgxVirtualSelectFieldOptionModel<TValue>
    >(this.normalizeKeyManagerOptions(options))
      .withTypeAhead(this.typeaheadDebounceInterval)
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withPageUpDown()
      .withAllowedModifierKeys(['shiftKey']);

    this._keyManager.tabOut.subscribe(() => {
      if (!this.isPanelOpened()) {
        return;
      }

      if (this._keyManager?.activeItem) {
        this.selectOptionByValue(options, this._keyManager.activeItem.value);
      }

      this.focus();
      this.close();
    });

    this._keyManager.change.subscribe((index) => {
      // Only update option component styles when panel is open and options are rendered
      if (!this.isPanelOpened()) {
        return;
      }

      this.assertIsDefined(this.optionsQuery, `optionsQuery is not defined`);

      this.updateActiveOptionComponent(
        this.optionsQuery.toArray(),
        options[index],
        index,
      );
    });

    // Sync key manager with current selection (for arrow key navigation when panel is closed)
    if (!this._selectionModel.isEmpty()) {
      const selectedOption = this._selectionModel.selected[0];
      const selectedIndex = options.findIndex(
        (o) => o.value === selectedOption?.value,
      );
      if (selectedIndex >= 0) {
        this._keyManager.setActiveItem(selectedIndex);
      }
    }
  }

  private normalizeKeyManagerOptions(
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
  ) {
    return options.map((option) => ({
      value: option.value,
      label: option.label,
      disabled: option.disabled ?? false,
      getLabel: () => option.getLabel?.() ?? option.label,
    }));
  }

  private updateActiveOptionComponent(
    optionComponents: NgxVirtualSelectFieldOptionComponent<TValue>[],
    activeOption: NgxVirtualSelectFieldOptionModel<TValue>,
    index: number,
  ) {
    optionComponents.forEach((option) => option.setInactiveStyles());

    const shouldScrollToActiveItem = this.shouldScrollToActiveItem(index);
    if (shouldScrollToActiveItem) {
      this.cdkVirtualScrollViewport.scrolledIndexChange
        .pipe(take(1))
        .subscribe(() => {
          this.assertIsDefined(
            this.optionsQuery,
            `optionsQuery is not defined`,
          );

          this.setActiveOptionComponentByValue(
            this.optionsQuery.toArray(),
            activeOption.value,
          );
        });

      this.cdkVirtualScrollViewport.scrollToIndex(index);
    } else {
      this.setActiveOptionComponentByValue(
        optionComponents,
        activeOption.value,
      );
    }
  }

  private shouldScrollToActiveItem(targetIndex: number): boolean {
    if (!this.isPanelOpened() || !this.cdkVirtualScrollViewport) {
      return false;
    }

    const scrollTop =
      this.cdkVirtualScrollViewport.elementRef.nativeElement.scrollTop;

    // NOTE: -1 is needed to prevent scrolling to next item out of the viewport
    const bottomScroll = scrollTop + this.optionHeight * this.maxPageSize - 1;
    const targetScroll = this.optionHeight * targetIndex;

    return scrollTop > targetScroll || bottomScroll < targetScroll;
  }

  private setActiveOptionComponentByValue(
    optionComponents: NgxVirtualSelectFieldOptionComponent<TValue>[],
    value: TValue,
  ) {
    const optionComponent = optionComponents.find(
      (option) => option.value === value,
    );

    // Option might not be rendered due to virtual scroll - skip if not found
    if (!optionComponent) {
      return;
    }

    optionComponent.setActiveStyles();
  }

  // #endregion Key manager

  /**
   * Check if a specific option is currently selected
   * Used by option components to determine their disabled state when max is reached
   */
  isOptionSelected(value: TValue): boolean {
    if (!this._selectionModel) {
      return false;
    }
    return this._selectionModel.selected.some(
      (opt) => opt != null && opt.value === value,
    );
  }

  /**
   * Get a Set of selected values for O(1) lookup performance
   * Used internally for bulk selection checks
   */
  private getSelectedValuesSet(): Set<TValue> {
    if (!this._selectionModel) {
      return new Set();
    }
    return new Set(
      this._selectionModel.selected
        .filter((opt) => opt != null)
        .map((opt) => opt.value),
    );
  }

  private focus() {
    this._elRef.nativeElement.focus();
  }

  private selectOptionByValue(
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
    value: TValue,
  ) {
    const { option } = this.findOptionByValue(options, value);

    // Check max limit before selecting
    if (this.maxSelectedItems > 0 &&
        !this._selectionModel.isSelected(option) &&
        this._selectionModel.selected.length >= this.maxSelectedItems) {
      return;
    }

    this._selectionModel.select(option);

    this.emitValue();
  }

  private updateRenderedOptionsState(
    _options: NgxVirtualSelectFieldOptionModel<TValue>[],
  ) {
    this.assertIsDefined(this.optionsQuery, `optionsQuery is not defined`);

    // Use Set for O(1) lookups instead of iterating selected array for each option
    const selectedValues = this.getSelectedValuesSet();

    this.optionsQuery.forEach((optionComponent) => {
      // Use value-based comparison instead of reference comparison
      // This fixes issues with virtual scroll where option references may change
      if (selectedValues.has(optionComponent.value)) {
        optionComponent.select();
      } else {
        // NOTE: deselect for all is needed because of virtual scroll and reusing options
        optionComponent.deselect();
      }
    });
  }

  private findOptionByValue(
    options: NgxVirtualSelectFieldOptionModel<TValue>[],
    value: TValue,
  ): { option: NgxVirtualSelectFieldOptionModel<TValue>; index: number } {
    const index = options.findIndex((option) => option.value === value);

    const option = options[index];

    this.assertIsDefined(option, `Option with value ${value} not found`);

    return { option, index };
  }

  private emitValue(): void {
    this._value = this._selectionModel.selected.map((option) => option.value);

    // Update selection count signal for reactivity
    this.selectedCount.set(this._selectionModel.selected.length);

    const outputValue = this.multiple ? this._value : this._value[0];

    this.valueChange.emit(outputValue);
    this._onChange(outputValue);
    this.selectionChange.emit(
      new NgxVirtualSelectFieldChange(this, outputValue),
    );
  }

  private assertIsDefined<T>(
    value: T,
    message: string,
  ): asserts value is NonNullable<T> {
    if (value === undefined || value === null) {
      throw new Error(message);
    }
  }

  private static nextId = 0;
}

export class NgxVirtualSelectFieldChange<TValue> {
  constructor(
    public source: NgxVirtualSelectFieldComponent<TValue>,
    public value: any,
  ) {}
}
