import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  CdkVirtualScrollViewport,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import { DOWN_ARROW } from '@angular/cdk/keycodes';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RenderResult, fireEvent, render } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { DebugElement } from '@angular/core';
import {
  NgxVirtualSelectFieldOptionForDirective,
  NgxVirtualSelectFieldOptionModel,
} from './virtual-select-field-option-for';
import { NgxVirtualSelectFieldOptionComponent } from './virtual-select-field-option';
import { NgxVirtualSelectFieldTriggerDirective } from './virtual-select-field-trigger';
import {
  NgxVirtualSelectFieldChange,
  NgxVirtualSelectFieldComponent,
} from './virtual-select-field.component';
describe('VirtualSelectFieldComponent', () => {
  beforeAll(() => {
    Element.prototype.scrollTo = () => {};
  });
  describe('as a single select control', () => {
    test('should render empty field wth placeholder', async () => {
      const expectedPlaceholder = 'test placeholder';
      const result = await Arrange.setupSingleSelectAsMaterialFormField({
        placeholder: expectedPlaceholder,
        options: Arrange.createOptions(),
        value: null,
      });
      expect(result.getByText(expectedPlaceholder)).toBeTruthy();
    });
    test('should render field with selected value', async () => {
      const options = Arrange.createOptions();
      const expectedPlaceholder = 'test placeholder';
      const expectedValue = options[2].value;
      const expectedValueLabel = options[2].label;
      const result = await Arrange.setupSingleSelectAsMaterialFormField({
        placeholder: expectedPlaceholder,
        options,
        value: expectedValue,
      });
      expect(result.queryByText(expectedPlaceholder)).toBeFalsy();
      expect(result.getByText(expectedValueLabel)).toBeTruthy();
    });
    test('should open panel with rendered options', async () => {
      const placeholder = 'placeholder text';
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupSingleSelectAsMaterialFormField({
        placeholder,
        options: Arrange.createOptions(),
        value: null,
      });
      result.fixture.autoDetectChanges();
      const trigger = result.getByText(placeholder);
      await user.click(trigger);
      const options = ElementQuery.allOptionComponents(result);
      expect(options.length).toBeGreaterThan(1);
    });
    test('should select option on click', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions();
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupSingleSelectAsMaterialFormField({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();
      const trigger = result.getByText(placeholder);
      await user.click(trigger);
      const optionsDebugElements = ElementQuery.allOptionComponents(result);
      Arrange.triggerScroll(ElementQuery.cdkViewPort(result));
      await result.fixture.whenStable();
      expect(optionsDebugElements.length).toBeGreaterThan(4);
      await user.click(optionsDebugElements[0].nativeElement);
      expect(wrapperComponent.value).toBe(options[0].value);
    });
  });
  describe('as a multi select control', () => {
    test('should render empty field wth placeholder', async () => {
      const expectedPlaceholder = 'placeholder';
      const result = await Arrange.setupMultiSelectAsMaterialFormField({
        placeholder: expectedPlaceholder,
        options: Arrange.createOptions(),
        value: null,
      });
      expect(result.getByText(expectedPlaceholder)).toBeTruthy();
    });
    test('should open panel with rendered options', async () => {
      const expectedPlaceholder = 'multi placeholder';
      const options = Arrange.createOptions();
      const expectedValues = [options[1].value, options[3].value];
      const expectedText = `${options[1].label}, ${options[3].label}`;
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupMultiSelectAsMaterialFormField({
        placeholder: expectedPlaceholder,
        options,
        value: expectedValues,
      });
      result.fixture.autoDetectChanges();
      const trigger = result.getByText(expectedText);
      await user.click(trigger);
      const optionElements = ElementQuery.allOptionComponents(result);
      expect(result.queryByText(expectedPlaceholder)).toBeFalsy();
      expect(result.getByText(expectedText)).toBeTruthy();
      expect(optionElements.length).toBeGreaterThan(1);
    });
    test('should select new item on click panel with rendered options', async () => {
      const expectedPlaceholder = 'multi placeholder';
      const options = Arrange.createOptions();
      const expectedValues = [
        options[1].value,
        options[3].value,
        options[2].value,
      ];
      const expectedTrigger = `${options[1].label}, ${options[3].label}, ${options[2].label}`;
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupMultiSelectAsMaterialFormField({
        placeholder: expectedPlaceholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();
      const trigger = result.getByText(expectedPlaceholder);
      await user.click(trigger);
      Arrange.triggerScroll(ElementQuery.cdkViewPort(result));
      await result.fixture.whenStable();
      const optionElements = ElementQuery.allOptionComponents(result);
      await user.click(optionElements[1].nativeElement);
      await user.click(optionElements[3].nativeElement);
      await user.click(optionElements[2].nativeElement);
      expect(wrapperComponent.value).toEqual(expectedValues);
      expect(result.getByText(expectedTrigger)).toBeTruthy();
    });
  });
  describe('keyboard shortcuts', () => {
    describe(' opened panel', () => {
      test('should activate item on arrowdown', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        await user.type(viewport.nativeElement, '[ArrowDown]');
        expect(ElementQuery.activeOption(result)).toBeDefined();
      });
      test('should close on alt+arrow', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        await user.type(viewport.nativeElement, '{alt>}{arrowdown}{/alt}');
        expect(ElementQuery.cdkViewPort(result)).toBeFalsy();
      });
      test('should select active item on enter', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        const wrapperComponent = Arrange.getWrapperComponent(result);
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        fireEvent.keyDown(
          viewport.nativeElement,
          Arrange.createEventArrowDownEvent(),
        );
        await user.type(viewport.nativeElement, '{enter}');
        expect(wrapperComponent.value).toBe(options[1].value);
      });
      test('should select all items on ctrl+a', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const expectedValues = options
          .filter((o) => !o.disabled)
          .map((o) => o.value);
        const result = await Arrange.setupMultiSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        const wrapperComponent = Arrange.getWrapperComponent(result);
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        await user.type(viewport.nativeElement, '[ControlLeft>][KeyA]');
        expect(wrapperComponent.value).toEqual(expectedValues);
      });
      test('should unselect all items on ctrl+a', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const value = options.filter((o) => !o.disabled).map((o) => o.value);
        const triggerText = options
          .filter((o) => !o.disabled)
          .map((o) => o.label)
          .join(', ');
        const result = await Arrange.setupMultiSelectAsMaterialFormField({
          placeholder,
          options,
          value,
        });
        const wrapperComponent = Arrange.getWrapperComponent(result);
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(triggerText);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        await user.type(viewport.nativeElement, '[ControlLeft>][KeyA]');
        expect(wrapperComponent.value).toEqual([]);
      });
      test('should append selected item on shift+arrowdown', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupMultiSelectAsMaterialFormField({
          placeholder,
          options,
          value: [options[1].value],
        });
        const wrapperComponent = Arrange.getWrapperComponent(result);
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(options[1].label);
        await user.click(trigger);
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
        fireEvent.keyDown(
          viewport.nativeElement,
          Arrange.createEventArrowDownEvent(),
        );
        fireEvent.keyDown(
          viewport.nativeElement,
          Arrange.createEventArrowDownEvent({
            shiftKey: true,
          }),
        );
        expect(ElementQuery.activeOption(result)).toBeDefined();
        expect(wrapperComponent.value).toEqual([
          options[1].value,
          options[2].value,
        ]);
      });
    });
    describe('closed panel', () => {
      test('should open panel on space', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.type(trigger, '{space}');
        const viewport = ElementQuery.cdkViewPort(result);
        expect(viewport).toBeTruthy();
      });
      test('should open panel on alt+arrowdown', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        fireEvent.keyDown(
          trigger,
          Arrange.createEventArrowDownEvent({
            altKey: true,
          }),
        );
        expect(ElementQuery.cdkViewPort(result)).toBeTruthy();
      });
      test('should multiselect open panel on arrowdown', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const user = Arrange.setupUserEvent();
        const result = await Arrange.setupMultiSelectAsMaterialFormField({
          placeholder,
          options,
          value: null,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(placeholder);
        await user.type(trigger, '{arrowdown}');
        expect(ElementQuery.cdkViewPort(result)).toBeTruthy();
      });
      test('should select next item in single select on arrowdown', async () => {
        const placeholder = 'placeholder text';
        const options = Arrange.createOptions();
        const result = await Arrange.setupSingleSelectAsMaterialFormField({
          placeholder,
          options,
          value: options[3].value,
        });
        result.fixture.autoDetectChanges();
        const trigger = result.getByText(options[3].label);
        fireEvent.keyDown(trigger, Arrange.createEventArrowDownEvent());
        await result.fixture.whenStable();
        // options[4] is the next non-disabled option after options[3]
        expect(result.getByText(options[4].label)).toBeTruthy();
      });
    });
  });
  describe('filterable select', () => {
    test('should select option on click without filtering', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions();
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableSingleSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Trigger scroll to render options
      Arrange.triggerScroll(ElementQuery.cdkViewPort(result));
      await result.fixture.whenStable();

      // Click an option
      const optionsDebugElements = ElementQuery.allOptionComponents(result);
      expect(optionsDebugElements.length).toBeGreaterThan(0);
      await user.click(optionsDebugElements[1].nativeElement);

      // Verify selection and panel closed
      expect(wrapperComponent.value).toBe(options[1].value);
      expect(ElementQuery.cdkViewPort(result)).toBeFalsy();
    });

    test('should select option on click after filtering', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions();
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableSingleSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Type in filter - query from document.body since overlay is in a portal
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      expect(filterInput).toBeTruthy();
      await user.type(filterInput, '1 Option');

      // Wait for filtering to apply
      await result.fixture.whenStable();

      // Trigger scroll to render filtered options
      const viewport = ElementQuery.cdkViewPort(result);
      if (viewport) {
        Arrange.triggerScroll(viewport);
      }
      await result.fixture.whenStable();

      // Click the first filtered option
      const optionsDebugElements = ElementQuery.allOptionComponents(result);
      expect(optionsDebugElements.length).toBeGreaterThan(0);
      await user.click(optionsDebugElements[0].nativeElement);

      // Verify selection was made and panel closed (no freeze)
      expect(wrapperComponent.value).toBeDefined();
      expect(ElementQuery.cdkViewPort(result)).toBeFalsy();
    });

    test('should select multiple options after filtering', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions();
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Type in filter - query from document.body since overlay is in a portal
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      expect(filterInput).toBeTruthy();
      await user.type(filterInput, '1');

      // Wait for filtering to apply
      await result.fixture.whenStable();

      // Trigger scroll to render filtered options
      const viewport = ElementQuery.cdkViewPort(result);
      if (viewport) {
        Arrange.triggerScroll(viewport);
      }
      await result.fixture.whenStable();

      // Click multiple filtered options
      const optionsDebugElements = ElementQuery.allOptionComponents(result);
      expect(optionsDebugElements.length).toBeGreaterThan(1);

      // Click first option
      await user.click(optionsDebugElements[0].nativeElement);
      await result.fixture.whenStable();

      // Click second option
      await user.click(optionsDebugElements[1].nativeElement);
      await result.fixture.whenStable();

      // Verify multiple selections were made (no freeze)
      expect(wrapperComponent.value).toBeDefined();
      expect(Array.isArray(wrapperComponent.value)).toBe(true);
      expect((wrapperComponent.value as number[]).length).toBe(2);
    });

    test('should select only filtered options when clicking select-all checkbox with active filter', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20); // Options: "0 Option", "1 Option", ..., "19 Option"
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Type filter to show only options containing "1" (1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19)
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      expect(filterInput).toBeTruthy();
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Click the select-all checkbox
      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      expect(selectAllCheckbox).toBeTruthy();
      await user.click(selectAllCheckbox);
      await result.fixture.whenStable();

      // Should select only options containing "1" that are not disabled
      // Options with "1": 1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
      // Disabled: 0, 5, 10, 15 (index % 5 === 0)
      // So enabled options with "1": 1, 11, 12, 13, 14, 16, 17, 18, 19
      const selectedValues = wrapperComponent.value as number[];
      expect(selectedValues).toBeDefined();
      expect(Array.isArray(selectedValues)).toBe(true);

      // Verify only filtered, enabled options are selected
      const expectedValues = [1, 11, 12, 13, 14, 16, 17, 18, 19];
      expect(selectedValues.sort((a, b) => a - b)).toEqual(expectedValues);
    });

    test('should deselect only filtered options when clicking select-all checkbox with all filtered selected', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      // Pre-select some options including filtered ones and non-filtered ones
      // Options containing "1": 1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
      // Also select option 2 (doesn't contain "1")
      const initialSelection = [1, 2, 11, 12, 13, 14, 16, 17, 18, 19];
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: initialSelection,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const triggerText = initialSelection.map((v) => `${v} Option`).join(', ');
      const trigger = result.getByText(triggerText);
      await user.click(trigger);

      // Type filter to show only options containing "1"
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Click the select-all checkbox to deselect all filtered options
      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      await user.click(selectAllCheckbox);
      await result.fixture.whenStable();

      // Should only deselect filtered options, keeping option 2 selected
      const selectedValues = wrapperComponent.value as number[];
      expect(selectedValues).toEqual([2]);
    });

    test('should select only filtered options with Ctrl+A when filter is active', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Type filter to show only options containing "1"
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Press Ctrl+A while viewport is focused
      const viewport = ElementQuery.cdkViewPort(result);
      expect(viewport).toBeTruthy();
      await user.type(viewport.nativeElement, '[ControlLeft>][KeyA]');
      await result.fixture.whenStable();

      // Should select only options containing "1" that are not disabled
      const selectedValues = wrapperComponent.value as number[];
      const expectedValues = [1, 11, 12, 13, 14, 16, 17, 18, 19];
      expect(selectedValues.sort((a, b) => a - b)).toEqual(expectedValues);
    });

    test('should preserve selections when filter is cleared', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: null,
      });
      const wrapperComponent = Arrange.getWrapperComponent(result);
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText(placeholder);
      await user.click(trigger);

      // Type filter and select all filtered
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      await user.click(selectAllCheckbox);
      await result.fixture.whenStable();

      const selectedAfterFilter = [...(wrapperComponent.value as number[])];

      // Clear the filter
      await user.clear(filterInput);
      await result.fixture.whenStable();

      // Selections should be preserved
      const selectedAfterClear = wrapperComponent.value as number[];
      expect(selectedAfterClear.sort((a, b) => a - b)).toEqual(
        selectedAfterFilter.sort((a, b) => a - b),
      );
    });

    test('should show indeterminate state when some filtered options are selected', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      // Pre-select only option 1 (which will be in filtered results)
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: [1],
      });
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText('1 Option');
      await user.click(trigger);

      // Type filter to show options containing "1"
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Check that the checkbox is in indeterminate state (via CSS class)
      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      expect(selectAllCheckbox).toBeTruthy();
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-indeterminate')).toBe(true);
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-checked')).toBe(false);
    });

    test('should show checked state when all filtered options are selected', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      // Pre-select all enabled options containing "1"
      const allFilteredEnabled = [1, 11, 12, 13, 14, 16, 17, 18, 19];
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: allFilteredEnabled,
      });
      result.fixture.autoDetectChanges();

      // Open the panel
      const triggerText = allFilteredEnabled.map((v) => `${v} Option`).join(', ');
      const trigger = result.getByText(triggerText);
      await user.click(trigger);

      // Type filter to show options containing "1"
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Check that the checkbox is in checked state (via CSS class)
      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      expect(selectAllCheckbox).toBeTruthy();
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-checked')).toBe(true);
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-indeterminate')).toBe(false);
    });

    test('should show unchecked state when no filtered options are selected', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions(20);
      const user = Arrange.setupUserEvent();
      // Pre-select option 2 (not in filtered results for "1")
      const result = await Arrange.setupFilterableMultiSelect({
        placeholder,
        options,
        value: [2],
      });
      result.fixture.autoDetectChanges();

      // Open the panel
      const trigger = result.getByText('2 Option');
      await user.click(trigger);

      // Type filter to show options containing "1"
      const filterInput = document.body.querySelector(
        'input[placeholder="Search..."]',
      ) as HTMLInputElement;
      await user.type(filterInput, '1');
      await result.fixture.whenStable();

      // Check that the checkbox is in unchecked state (no checked or indeterminate class)
      const selectAllCheckbox = document.body.querySelector(
        '.ngx-virtual-select-field-select-all mat-pseudo-checkbox',
      ) as HTMLElement;
      expect(selectAllCheckbox).toBeTruthy();
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-checked')).toBe(false);
      expect(selectAllCheckbox.classList.contains('mat-pseudo-checkbox-indeterminate')).toBe(false);
    });
  });

  describe('as a control value accessor', () => {
    test('should bind to form control', async () => {
      const options = Arrange.createOptions();
      const option = options[2];
      const result = await Arrange.setupAsFormControl({
        placeholder: null,
        options,
        value: option.value,
      });
      const trigger = await result.findByText(option.label);
      expect(trigger).toBeTruthy();
    });
    test('should trigger value after form update', async () => {
      const options = Arrange.createOptions();
      const option = options[3];
      const result = await Arrange.setupAsFormControl({
        placeholder: null,
        options,
        value: null,
      });
      result.fixture.componentInstance.control.setValue(option.value);
      const trigger = await result.findByText(option.label);
      expect(trigger).toBeTruthy();
    });
    it('should propagate all events', async () => {
      const placeholder = 'placeholder text';
      const options = Arrange.createOptions();
      const option = options[3];
      const user = Arrange.setupUserEvent();
      const result = await Arrange.setupAsFormControl({
        placeholder,
        options,
        value: null,
      });
      result.fixture.autoDetectChanges();
      const trigger = await result.findByText(placeholder);
      await user.click(trigger);
      const optionsDebugElements = ElementQuery.allOptionComponents(result);
      await user.click(optionsDebugElements[3].nativeElement);
      expect(result.fixture.componentInstance.value).toBe(option.value);
      expect(result.fixture.componentInstance.control.value).toBe(option.value);
      expect(result.fixture.componentInstance.selectionChange).toEqual({
        value: option.value,
        source:
          ElementQuery.ngxVirtualSelectFieldComponent(result).componentInstance,
      });
    });
  });
});
const Arrange = {
  async setupSingleSelectAsMaterialFormField<TValue>(componentProperties: {
    placeholder: string;
    options: NgxVirtualSelectFieldOptionModel<TValue>[];
    value: TValue;
  }): Promise<
    RenderResult<{
      value: TValue;
    }>
  > {
    return await render(
      `
      <mat-form-field>
        <ngx-virtual-select-field [value]="value" (valueChange)="value = $event" [placeholder]="placeholder" [multiple]="multiple">
          <ngx-virtual-select-field-option
            *ngxVirtualSelectFieldOptionFor="let option of options"
            [value]="option.value"
          >
            {{ option.label }}
          </ngx-virtual-select-field-option>
        </ngx-virtual-select-field>
      </mat-form-field>`,
      {
        componentProperties: {
          ...componentProperties,
        },
        imports: [
          MatFormFieldModule,
          NgxVirtualSelectFieldComponent,
          NgxVirtualSelectFieldOptionForDirective,
          NgxVirtualSelectFieldOptionComponent,
          NgxVirtualSelectFieldTriggerDirective,
        ],
      },
    );
  },
  async setupMultiSelectAsMaterialFormField<TValue>(componentProperties: {
    placeholder: string;
    options: NgxVirtualSelectFieldOptionModel<TValue>[];
    value: TValue[] | null;
  }): Promise<
    RenderResult<{
      value: TValue[] | null;
      multiple: boolean;
    }>
  > {
    return await render(
      `
      <mat-form-field>
        <ngx-virtual-select-field [value]="value" (valueChange)="value = $event" [placeholder]="placeholder" [multiple]="multiple">
          <ngx-virtual-select-field-option
            *ngxVirtualSelectFieldOptionFor="let option of options"
            [value]="option.value"
          >
            {{ option.label }}
          </ngx-virtual-select-field-option>
        </ngx-virtual-select-field>
      </mat-form-field>`,
      {
        componentProperties: {
          multiple: true,
          ...componentProperties,
        },
        imports: [
          MatFormFieldModule,
          NgxVirtualSelectFieldComponent,
          NgxVirtualSelectFieldOptionForDirective,
          NgxVirtualSelectFieldOptionComponent,
          NgxVirtualSelectFieldTriggerDirective,
        ],
      },
    );
  },
  async setupFilterableSingleSelect<TValue>(componentProperties: {
    placeholder: string;
    options: NgxVirtualSelectFieldOptionModel<TValue>[];
    value: TValue | null;
  }): Promise<
    RenderResult<{
      value: TValue | null;
    }>
  > {
    return await render(
      `
      <mat-form-field>
        <ngx-virtual-select-field
          [value]="value"
          (valueChange)="value = $event"
          [placeholder]="placeholder"
          [filterable]="true"
        >
          <ngx-virtual-select-field-option
            *ngxVirtualSelectFieldOptionFor="let option of options"
            [value]="option.value"
          >
            {{ option.label }}
          </ngx-virtual-select-field-option>
        </ngx-virtual-select-field>
      </mat-form-field>`,
      {
        componentProperties: {
          ...componentProperties,
        },
        imports: [
          MatFormFieldModule,
          NgxVirtualSelectFieldComponent,
          NgxVirtualSelectFieldOptionForDirective,
          NgxVirtualSelectFieldOptionComponent,
          NgxVirtualSelectFieldTriggerDirective,
        ],
      },
    );
  },
  async setupFilterableMultiSelect<TValue>(componentProperties: {
    placeholder: string;
    options: NgxVirtualSelectFieldOptionModel<TValue>[];
    value: TValue[] | null;
  }): Promise<
    RenderResult<{
      value: TValue[] | null;
    }>
  > {
    return await render(
      `
      <mat-form-field>
        <ngx-virtual-select-field
          [value]="value"
          (valueChange)="value = $event"
          [placeholder]="placeholder"
          [filterable]="true"
          [multiple]="true"
        >
          <ngx-virtual-select-field-option
            *ngxVirtualSelectFieldOptionFor="let option of options"
            [value]="option.value"
          >
            {{ option.label }}
          </ngx-virtual-select-field-option>
        </ngx-virtual-select-field>
      </mat-form-field>`,
      {
        componentProperties: {
          ...componentProperties,
        },
        imports: [
          MatFormFieldModule,
          NgxVirtualSelectFieldComponent,
          NgxVirtualSelectFieldOptionForDirective,
          NgxVirtualSelectFieldOptionComponent,
          NgxVirtualSelectFieldTriggerDirective,
        ],
      },
    );
  },
  async setupAsFormControl<TValue>(componentProperties: {
    placeholder: string | null;
    options: NgxVirtualSelectFieldOptionModel<TValue>[];
    value: TValue | null;
  }): Promise<
    RenderResult<{
      placeholder: string | null;
      control: FormControl;
      options: NgxVirtualSelectFieldOptionModel<TValue>[];
      value: TValue | null;
      selectionChange: NgxVirtualSelectFieldChange<TValue> | null;
    }>
  > {
    return await render(
      `
        <ngx-virtual-select-field [formControl]="control" [placeholder]="placeholder" (valueChange)="value = $event" (selectionChange)="selectionChange = $event">
          <ngx-virtual-select-field-option
            *ngxVirtualSelectFieldOptionFor="let option of options"
            [value]="option.value"
          >
            {{ option.label }}
          </ngx-virtual-select-field-option>
        </ngx-virtual-select-field>
    `,
      {
        componentProperties: {
          placeholder: componentProperties.placeholder,
          options: componentProperties.options,
          control: new FormControl(componentProperties.value),
          value: componentProperties.value,
          selectionChange: null,
        },
        imports: [
          MatFormFieldModule,
          ReactiveFormsModule,
          NgxVirtualSelectFieldComponent,
          NgxVirtualSelectFieldOptionForDirective,
          NgxVirtualSelectFieldOptionComponent,
          NgxVirtualSelectFieldTriggerDirective,
        ],
      },
    );
  },
  getWrapperComponent<TValue>(
    render: RenderResult<
      unknown,
      {
        value: TValue;
      }
    >,
  ) {
    return render.fixture.componentInstance;
  },
  setupUserEvent() {
    return userEvent.setup();
  },
  createOptions(amount = 100): NgxVirtualSelectFieldOptionModel<number>[] {
    return new Array(amount).fill(null).map((_, index) => ({
      value: index,
      label: `${index} Option`,
      disabled: index % 5 === 0,
    }));
  },
  createEventArrowDownEvent(fields = {}) {
    return {
      keyCode: DOWN_ARROW,
      key: 'ArrowDown',
      ...fields,
    };
  },
  triggerScroll(viewport: DebugElement) {
    viewport.injector.get(VIRTUAL_SCROLL_STRATEGY).onContentScrolled();
  },
};
const ElementQuery = {
  allOptionComponents(renderResult: RenderResult<unknown, unknown>) {
    return renderResult.debugElement.queryAll(
      By.directive(NgxVirtualSelectFieldOptionComponent),
    );
  },
  cdkViewPort(renderResult: RenderResult<unknown, unknown>) {
    return renderResult.debugElement.query(
      By.directive(CdkVirtualScrollViewport),
    );
  },
  activeOption(renderResult: RenderResult<unknown, unknown>) {
    return renderResult.debugElement.query(
      By.css('.ngx-virtual-select-field-option--active'),
    );
  },
  ngxVirtualSelectFieldComponent(renderResult: RenderResult<unknown, unknown>) {
    return renderResult.debugElement.query(
      By.directive(NgxVirtualSelectFieldComponent),
    );
  },
};
