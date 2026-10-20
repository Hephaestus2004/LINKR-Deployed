# LINKR Client Editor

This is one shared Pages app for client profile requests. It is intentionally separate from the production Pages project and has its own D1 and private R2 bindings. It contains no production D1 credentials and never sends client-entered text to the main profile renderer.

## Portal bindings

Configure these on the `linkr-client-editor` Pages project, separately for preview and production:

- D1 binding `PORTAL_DB` to a new database used only by this portal.
- R2 binding `PORTAL_UPLOADS` to a new private bucket used only for request uploads.
- Secret `PORTAL_API_TOKEN`, generated with a long random value. The main production server will need the same value as `CLIENT_PORTAL_API_TOKEN` for server-to-server invitation and review calls.
- Custom domain `edit-my-profile.linkr-tap.site`.

Apply [0001_portal.sql](./migrations/0001_portal.sql) to the portal database before using the app. Do not bind the production `linkr-db` or `linkr-assets` resources here.

The private invitation endpoint creates seven-day links at `/api/internal/invites`. Only the server holding `PORTAL_API_TOKEN` can create invitations or review requests. Client invitation tokens are stored as SHA-256 hashes, exchanged for a host-only `HttpOnly; Secure; SameSite=Strict` session cookie, then removed from the browser URL by redirecting to `/`.

## Local development

Run Pages dev from this directory with a local D1 database bound as `PORTAL_DB` and an R2 bucket bound as `PORTAL_UPLOADS`. Apply migrations locally first. The app is not usable until an internal invitation has been created.

## Isolation notes

- The portal's browser UI uses fixed HTML components and `textContent`; it never renders client strings as HTML or runs customer code.
- Public submission accepts a strict field allowlist and bounded request/image sizes.
- The request reference is returned only to its invitation session. It is not an access token.
- Request uploads remain in the portal bucket. Production promotion must fetch and validate the approved snapshot server-side, verify its approval hash, copy approved assets into production storage, and validate once more before publishing.
- Unapproved request data and uploads expire seven days after invitation creation. Deploy `cleanup-worker.ts` as a separate scheduled Worker with the same portal-only `PORTAL_DB` and `PORTAL_UPLOADS` bindings and a daily cron. Pages does not run scheduled events. The worker expires and deletes unapproved request data and uploads; approved snapshots and published production assets remain available.
