# LINKR Glass Profile Template

A reusable, data-driven digital contact profile with a dark glassmorphism
interface, circular quick-action buttons, QR flip card, save-contact flow,
share action, and responsive mobile layout.

This folder is intended to be duplicated for each new client. The profile is
configured through `client.txt`, so the HTML, CSS, and JavaScript generally do
not need to change between builds.

## Quick start

1. Duplicate this folder for a new client.
2. Edit `client.txt`.
3. Replace the placeholder files in `assets/`:
   - `profile-photo.svg` with the client's square photo (`.png`, `.jpg`, or `.webp`)
   - `company-logo.svg` with the client's logo
   - `qr-code.svg` with a QR code for the final public URL
4. Update the matching paths in `client.txt` if filenames or extensions change.
5. Run a local server from this folder:

   ```text
   py -m http.server 8000
   ```

6. Open `http://localhost:8000`.

Do not open `index.html` directly with `file://`; browsers block the runtime
request for `client.txt`.

## Client data

`client.txt` is parsed at runtime. Supported profile fields include:

- `name`, `company`, `title`, `title_link`, and `bio`
- `photo`, `company_logo`, and `qr_code`
- `phone`, `email`, `website`, `facebook`, `instagram`, `linkedin`, and `github`
- `telegram`, `whatsapp`, `viber`, `messenger`, `youtube`, and `tiktok`
- `location`

Append ` | Custom label` to a field to control its displayed label. For
example:

```text
location: Makati, PH | Studio
```

Theme fields include `theme`, `accent`, `background`, `profile_bg`, `surface`,
`border`, `text`, `muted`, and `action`. The default presentation is dark
glassmorphism. Use `theme: light` only when the client needs a light variant.

## Current design system

- Dark atmospheric background with blurred color orbs
- Frosted glass profile card with a soft inner highlight
- Founder identity hierarchy: name, uppercase title, and pin-marked location
- Circular quick actions for phone, email, social, website, and messaging
- Color-coded recognizable icons with muted labels
- One-line founder identity treatment with responsive fallback sizing
- Lower action area reserved for Save contact and Share profile
- QR code displayed on the reverse side of the profile card
- Responsive layout tuned for small mobile widths

## Important implementation notes

- Keep `client.txt` and `assets/` beside `index.html`.
- Generate the QR code only after the final public URL is known.
- Test phone, email, social links, QR flip, Share profile, and Save contact on
  both mobile and desktop.
- Replace placeholder social URLs before deploying.
- The page uses the existing browser-native Web Share API when available and
  falls back to copying the profile URL.
