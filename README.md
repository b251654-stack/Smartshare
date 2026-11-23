# SmartShare

SmartShare is a browser-based design editor MVP built with React, TypeScript, and Vite.

## Current features

- Responsive workspace and searchable template gallery
- Editable canvas with text, shapes, images, layers, and backgrounds
- Undo/redo, copy/paste, rotation, flip, opacity, and shadow controls
- Multiple named projects with open, duplicate, delete, and autosave
- SVG, 2x PNG, and 2x JPG downloads named after the project
- Supabase email sign-in and private, per-user project sync when configured
- Local browser saves remain available when Supabase is not configured

## Connect Supabase

1. Create a Supabase project and enable email/password authentication.
2. Copy `.env.example` to `.env.local`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings.
3. Run [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor to create the projects table and row-level security policies.
4. Restart the Vite server. Add the same two public client settings to your production hosting provider before deployment.

Only the Supabase publishable key belongs in frontend environment variables. Never put a service-role key or database password in `VITE_*` variables or client code.

## Roadmap

1. Move uploaded images to private Supabase Storage
2. Expand the template and asset library
3. PDF export
4. Free, Pro, and Team subscriptions
5. AI creation tools with usage limits
6. Collaboration and team workspaces
7. Production deployment, analytics, and customer support

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
```
