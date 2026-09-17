<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UI Component & Design System Rules (Shadcn & Tailwind CSS)

You MUST ALWAYS adhere to the following rules when creating, editing, or generating UI components and views in this repository:

1. **Reusability First (Prioritaskan Komponen yang Sudah Ada)**:
   - When creating or modifying screens, forms, or views, ALWAYS inspect `@/components/ui/` first and use existing components (e.g. `Button`, `Input`, `Label`, `PasswordInput`, `Card`).
   - DO NOT write raw HTML form controls or custom button/input elements directly in page views if a component in `components/ui/` already exists or can be used.

2. **Modular Primitive Creation**:
   - If a required UI primitive (e.g., dialog, select, tooltip, badge, etc.) is missing from `@/components/ui/`, you MUST first create it as a clean, reusable component in `components/ui/` following Shadcn UI conventions (using `@base-ui/react` primitives or standard Accessible React primitives with `cn()`), and THEN import it into the feature/page.

3. **Shadcn & Tailwind CSS Standards**:
   - All components must use Tailwind CSS utility classes and semantic theme variables defined in `app/globals.css` (e.g., `bg-background`, `text-foreground`, `border-border`, `focus-visible:ring-ring`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`, etc.).
   - Ensure proper dark mode support and theme token usage. Avoid hardcoding raw colors like `border-gray-300` or `bg-blue-600` when semantic tokens (`border-input`, `bg-primary`) apply.

4. **Accessibility (a11y) & UX**:
   - Always ensure components have accessible names, proper `aria-*` attributes, focus indicators (`focus-visible:ring-ring`), keyboard navigation, and explicit button types (`type="button"` for non-submitting action buttons).
