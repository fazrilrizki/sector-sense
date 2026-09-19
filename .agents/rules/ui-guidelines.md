# UI Component & Design System Guidelines

## Priority Rule: Reuse Existing Components
- Before creating or styling any interface element, check `@/components/ui/` for existing components.
- Always use `Button`, `Input`, `Label`, `PasswordInput`, `Card`, etc., from `@/components/ui/`.
- Do not create inline, duplicate, or raw HTML primitives (`<button>`, `<input>`) when a UI component exists.

## Component Creation Standard
- If a UI primitive is not in `@/components/ui/`, build it there first following Shadcn UI architecture (`@base-ui/react`, `cva`, `cn`).
- Use semantic Tailwind CSS theme tokens (`bg-background`, `text-foreground`, `border-border`, `ring-ring`, `bg-primary`, `text-muted-foreground`).
- Ensure accessibility: label association, keyboard interaction, focus rings, and explicit button types.

## Enforcement for New Additions
- Engineers MUST strictly follow these UI guidelines for any new feature, screen, or component additions.
- Prioritize design consistency over novel implementations. Always leverage the established design system rather than introducing ad-hoc or unstandardized styling.
