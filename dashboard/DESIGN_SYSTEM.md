# Dashboard Design System

This design system is scoped to the local dashboard only. Do not import these
tokens or classes into Remotion video compositions or video visual components.

## Tokens

Dashboard tokens live in `dashboard/styles.css` under the `--dash-*` prefix.
Use them for new dashboard UI:

- Colors: `--dash-color-bg`, `--dash-color-surface-*`, `--dash-color-text-*`,
  `--dash-color-accent-*`, `--dash-color-status-*`
- Spacing: `--dash-space-*`
- Radius: `--dash-radius-*`
- Shadows: `--dash-shadow-*`
- Typography: `--dash-font-family`, `--dash-font-mono`

Legacy variables such as `--bg`, `--panel`, `--accent`, and `--radius-panel`
remain as aliases while older dashboard screens are migrated.

## Components

Use `ds-*` classes for new dashboard markup. Existing classes are still valid
aliases during migration.

- Buttons: `ds-button`, with `ds-button--primary`, `ds-button--secondary`,
  `ds-button--ghost`, `ds-button--danger`, and `ds-button--compact`
- Chips: `ds-chip`, with `ds-chip--neutral`, `ds-chip--ready`,
  `ds-chip--running`, `ds-chip--success`, `ds-chip--warning`, and
  `ds-chip--error`
- Panels: `ds-panel`, `ds-panel__header`
- Cards and sections: `ds-card`, `ds-section`
- Forms: `ds-field`, `ds-label`, `ds-control`, `ds-control--compact`
- Feedback: `ds-notice`, with `ds-notice--info`, `ds-notice--success`,
  `ds-notice--warning`, and `ds-notice--error`
- Layout helpers: `ds-stack`, `ds-inline`, `ds-split`, `ds-scroll-surface`

## Migration Rule

When touching dashboard UI, add the `ds-*` class alongside the legacy class
first. Remove legacy classes only in a dedicated cleanup pass after all
dashboard routes are migrated.
