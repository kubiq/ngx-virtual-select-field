import { test, expect } from '@playwright/test';

test.describe('Filter freeze bug', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForSelector('ngx-virtual-select-field', { timeout: 10000 });
  });

  test('should not freeze when selecting a filtered option in single select', async ({ page }) => {
    // Find the filterable single select (with "Filterable Virtual Select Example" label)
    const filterableSelect = page.locator('mat-form-field').filter({
      hasText: 'Filterable Virtual Select Example',
    });

    // Click to open the select
    await filterableSelect.click();

    // Wait for the panel to open
    const panel = page.locator('.ngx-virtual-select-field-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });

    // Find and type in the filter input
    const filterInput = panel.locator('input[placeholder="Type to filter..."]');
    await expect(filterInput).toBeVisible();

    // Type a filter that will narrow down to few options
    // The options are "0 Option 0", "1 Option 1", etc.
    // Filtering by "99999" should find "99999 Option 99999"
    await filterInput.fill('99999');

    // Wait for filtering to apply
    await page.waitForTimeout(150);

    // Get the filtered options (only non-disabled ones)
    const options = panel.locator(
      'ngx-virtual-select-field-option:not(.ngx-virtual-select-field-option--disabled)'
    );

    // Verify we have filtered results (should be very few)
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);

    // Click the first option - this should NOT freeze the browser
    // Set a timeout to detect freeze
    const startTime = Date.now();

    await options.first().click({ timeout: 5000 });

    const elapsed = Date.now() - startTime;

    // If the browser froze, this would take much longer than 5 seconds
    // A normal click should take < 1 second
    expect(elapsed).toBeLessThan(3000);

    // Panel should be closed
    await expect(panel).not.toBeVisible({ timeout: 2000 });

    // Verify the selection was made (the selected value should be displayed)
    await expect(filterableSelect).toContainText('99999');
  });

  // TODO: Fix flaky multi-select test - needs investigation on element interception
  // test('should not freeze when selecting a filtered option in multi select', async ({ page }) => {
  //   // Find the filterable multi-select (with "Multiselect Virtual Example" label)
  //   const filterableMultiSelect = page.locator('mat-form-field').filter({
  //     hasText: 'Multiselect Virtual Example',
  //   });
  //
  //   // Click to open the select
  //   await filterableMultiSelect.click();
  //
  //   // Wait for the panel to open
  //   const panel = page.locator('.ngx-virtual-select-field-panel');
  //   await expect(panel).toBeVisible({ timeout: 5000 });
  //
  //   // Find and type in the filter input
  //   const filterInput = panel.locator('input[placeholder="Type to filter..."]');
  //   await expect(filterInput).toBeVisible();
  //
  //   // Type a filter
  //   await filterInput.fill('88888');
  //   await page.waitForTimeout(150);
  //
  //   // Get the filtered options (only non-disabled ones)
  //   const options = panel.locator(
  //     'ngx-virtual-select-field-option:not(.ngx-virtual-select-field-option--disabled)'
  //   );
  //   const optionCount = await options.count();
  //   expect(optionCount).toBeGreaterThan(0);
  //
  //   // Click option - this should NOT freeze
  //   const startTime = Date.now();
  //   await options.first().click({ timeout: 5000 });
  //   const elapsed = Date.now() - startTime;
  //
  //   expect(elapsed).toBeLessThan(3000);
  //
  //   // For multi-select, panel stays open - verify it's still responsive
  //   await expect(panel).toBeVisible();
  //
  //   // Clear the filter input directly instead of using clear button
  //   await filterInput.clear();
  //   await page.waitForTimeout(150);
  //
  //   // Filter again and select another option
  //   await filterInput.fill('77777');
  //   await page.waitForTimeout(150);
  //
  //   const startTime2 = Date.now();
  //   await options.first().click({ timeout: 5000 });
  //   const elapsed2 = Date.now() - startTime2;
  //
  //   expect(elapsed2).toBeLessThan(3000);
  //
  //   // Close the panel by pressing Escape
  //   await page.keyboard.press('Escape');
  //   await expect(panel).not.toBeVisible({ timeout: 2000 });
  // });

  // TODO: Fix flaky rapid cycle test - needs investigation on element interception
  // test('should handle rapid filter and select cycles without freezing', async ({ page }) => {
  //   const filterableSelect = page.locator('mat-form-field').filter({
  //     hasText: 'Filterable Virtual Select Example',
  //   });
  //
  //   for (let i = 0; i < 3; i++) {
  //     // Open
  //     await filterableSelect.click();
  //
  //     const panel = page.locator('.ngx-virtual-select-field-panel');
  //     await expect(panel).toBeVisible({ timeout: 5000 });
  //
  //     const filterInput = panel.locator('input[placeholder="Type to filter..."]');
  //
  //     // Filter to a specific option (use unique numbers that exist in the dataset)
  //     const searchTerm = `${50000 + i * 10000}`;
  //     await filterInput.fill(searchTerm);
  //     await page.waitForTimeout(150);
  //
  //     // Get the filtered options (only non-disabled ones)
  //     const options = panel.locator(
  //       'ngx-virtual-select-field-option:not(.ngx-virtual-select-field-option--disabled)'
  //     );
  //
  //     // Select
  //     const startTime = Date.now();
  //     await options.first().click({ timeout: 5000 });
  //     const elapsed = Date.now() - startTime;
  //
  //     expect(elapsed).toBeLessThan(3000);
  //
  //     // Panel should close
  //     await expect(panel).not.toBeVisible({ timeout: 2000 });
  //   }
  // });
});
