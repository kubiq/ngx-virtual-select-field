<span><a href="https://www.npmjs.com/package/ngx-virtual-select-field-filterable" title="View this project on NPM">![NPM Version](https://img.shields.io/npm/v/ngx-virtual-select-field-filterable?style=flat&logo=npm)
</a></span>
<span><a href="https://github.com/kubiq/ngx-virtual-select-field/actions/workflows/test.yml" title="View this project workflow">![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/kubiq/ngx-virtual-select-field/test.yml?style=flat&logo=github&label=tests)
</a></span>

# Virtual Select component for Angular Material Form Field

This package replicates the Angular Material Select component with virtual scroll capabilities using cdk-virtual-scroll. It provides most major features of the original Angular Material Select component but with virtual scroll capabilities for handling large datasets efficiently (100,000+ items). One major difference is that this package does not support option groups at the moment.

## Features

- Virtual scroll for large datasets (100,000+ items)
- Single select
- Multi select with checkboxes
- Select all checkbox (for multi-select with filter)
- Filterable options with search input
- Clearable selection
- Loading spinner for async data
- Integrates with Angular Material Form Field
- Reactive Forms and Template-driven forms support
- Custom trigger template
- Custom option template
- Full keyboard navigation and shortcuts
- Type-ahead search
- Theming through CSS variables

## Not Supported Features (for now)

- Animations
- Custom Error state matcher
- Custom scroll strategy
- Full accessibility (in progress)
- Option groups

## Links

- [Full Documentation](./packages/ngx-virtual-select-field/README.md)
- [Demo](https://stackblitz.com/edit/demo-ngx-virtual-select-field)
- [Getting Started](./packages/ngx-virtual-select-field/README.md#getting-started)
- [API Reference](./packages/ngx-virtual-select-field/README.md#api)
- [Keyboard Shortcuts](./packages/ngx-virtual-select-field/README.md#keyboard-shortcuts)

## Quick Start

```bash
npm install ngx-virtual-select-field-filterable
```

```typescript
import { NgxVirtualSelectFieldBundle } from 'ngx-virtual-select-field-filterable';

@Component({
  imports: [NgxVirtualSelectFieldBundle],
  ...
})
```

## Example: Single Select

```html
<mat-form-field>
  <mat-label>Example</mat-label>
  <ngx-virtual-select-field [(value)]="value">
    <ngx-virtual-select-field-option
      *ngxVirtualSelectFieldOptionFor="let option of options"
      [value]="option.value">
      {{ option.label }}
    </ngx-virtual-select-field-option>
  </ngx-virtual-select-field>
</mat-form-field>
```

## Example: Multi Select with Filter

```html
<mat-form-field>
  <mat-label>Filterable Multi Select</mat-label>
  <ngx-virtual-select-field
    [(value)]="value"
    [multiple]="true"
    [filterable]="true"
    [clearable]="true">
    <ngx-virtual-select-field-option
      *ngxVirtualSelectFieldOptionFor="let option of options"
      [value]="option.value">
      {{ option.label }}
    </ngx-virtual-select-field-option>
  </ngx-virtual-select-field>
</mat-form-field>
```

## Keyboard Shortcuts

| Shortcut | Description |
|----------|-------------|
| `ArrowDown` / `ArrowUp` | Navigate through options |
| `Enter` / `Space` | Toggle selection |
| `Ctrl + A` | Select/deselect all (multi-select) |
| `Shift + Arrow` | Extend selection (multi-select) |
| `Escape` | Close panel |
| Type any character | Type-ahead search |

[See all keyboard shortcuts](./packages/ngx-virtual-select-field/README.md#keyboard-shortcuts)

## License

MIT
