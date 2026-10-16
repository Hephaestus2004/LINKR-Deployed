# LINKR

## 1. System overview

LINKR is a reusable, static digital-contact-profile system. Each profile is a
standalone folder that can be copied for a client or staff member and deployed
without a backend, build step, framework, package manager, or server-side
runtime.

The workspace currently contains two profile variants:

| Variant | Folder | Intended use | Default visual style |
| --- | --- | --- | --- |
| Client | [`client-template - white normal`](./client-template%20-%20white%20normal/) | General client contact pages | Light, clean card layout |
| Staff | [`staff-template-linkr-profile`](./staff-template-linkr-profile/) | LINKR/staff or founder profiles | Dark glassmorphism |

Although the visual styles differ, both variants use the same basic
architecture:

1. `index.html` provides the semantic shell and empty render targets.
2. `style.css` provides the responsive visual system.
3. `script.js` loads and parses `client.txt`, then populates the page.
4. `client.txt` is the runtime data source for identity, branding, links,
   theme values, and optional display flags.
5. `assets/` contains the favicon, profile photo, company logo, and QR image.

The page is intentionally data-driven. A new profile normally requires
duplicating a template folder, editing `client.txt`, replacing the assets, and
deploying the folder contents.

## 2. Directory structure

Each template follows this structure:

```text
template-folder/
├── index.html
├── script.js
├── style.css
├── client.txt
├── README.md
├── .gitignore                 # staff template only
└── assets/
    ├── contact-favicon.svg
    ├── company-logo.svg
    ├── profile-photo.svg
    └── qr-code.svg
```

The SVG files are placeholders. The supplied QR image explicitly says
`REPLACE QR CODE`, and the profile/logo images contain replacement artwork.
They must be replaced before a real profile is delivered.

The staff template includes a `.gitignore` that excludes editor metadata,
operating-system files, environment files, logs, and generated `.vcf` contact
exports. The site itself does not read environment variables or secrets.

## 3. Page structure

`index.html` is mostly static markup. JavaScript fills the elements that have
stable IDs:

- `#name`: display name.
- `#title`: job title, optionally linked to `title_link`.
- `#bio`: optional biography.
- `#location`: staff variant only; rendered with a location icon.
- `#photo`: profile photo.
- `#company-logo`: company logo.
- `#company-logo-link`: link around the company logo.
- `#quick-actions`: compact action buttons.
- `#profile-inner`: the 3D flip-card container.
- `.profile-qr`: QR image on the reverse side.
- `#save`: Save contact button.
- `#vcf-fallback`: fallback link shown after the Android contact intent.
- `#links`: full contact and social-link list.

The profile card has two faces:

- The front contains the logo, identity information, photo, quick actions, and
  QR toggle.
- The back contains the QR code and a button to return to the profile.

The footer links to the LINKR public landing page
(`https://linkr-tap-connect.vercel.app/`) and displays the year `2026`.

## 4. Runtime loading and rendering pipeline

When `script.js` loads, it performs these steps:

1. Registers QR flip-card behavior immediately.
2. Fetches `client.txt` with `cache: 'no-store'`.
3. Rejects non-2xx responses and logs the error.
4. Parses each non-empty, non-comment line.
5. Applies identity, links, images, and optional display fields.
6. Creates the Save contact button when a `name` exists.
7. Creates quick actions from the variant's quick-action list.
8. Applies theme and color customization.
9. Applies standard or logo-only profile mode.

If `client.txt` cannot be loaded, the error is logged as
`Unable to load contact information.` and the dynamic profile is not
populated. There is no server-side fallback.

### Local serving requirement

`client.txt` is fetched at runtime, so opening `index.html` directly with
`file://` is not supported by normal browser security rules. Run a local
server from the selected template folder instead:

```text
py -m http.server 8000
```

Then open `http://localhost:8000`.

The same rule applies in production: `index.html`, `script.js`, `style.css`,
`client.txt`, and `assets/` must be served from the deployed site.

## 5. `client.txt` data format

The parser expects one `key: value` entry per line:

```text
name: Alex Example
email: hello@example.com
location: Makati, PH | Studio
```

Parsing behavior:

- Leading and trailing whitespace is removed.
- Blank lines and lines beginning with `#` are ignored.
- The first colon separates the key from the value.
- Keys are converted to lowercase.
- A final ` | Label` suffix is removed from the value and stored as the
  display label.
- Values may contain earlier colons.
- Repeated keys are not explicitly rejected; most lookups use the first match,
  while rendering iterates through all entries.

Keep URLs complete with `https://` where possible. Website and social values
without an HTTP scheme are automatically prefixed with `https://`.

### Identity and branding fields

| Key | Behavior |
| --- | --- |
| `name` | Display name, page title, photo alt text, and vCard name. |
| `company` | Logo accessibility label; included in the page title for the staff variant and in vCards. It is not rendered as a separate visible company text block. |
| `company_logo` | Image path for the company logo. |
| `title` | Job title. |
| `title_link` | External URL used by the title and company-logo link. |
| `bio` | Optional description below the title. |
| `photo` | Profile image path. |
| `qr_code` | QR image path shown on the card's reverse face. |
| `location` | Google Maps link in the full links list; visible with a pin icon in the staff profile. |

### Display and theme fields

| Key | Accepted values/behavior |
| --- | --- |
| `profile_mode` | `standard` or `logo_only`; both `logo_only` and `logo-only` are accepted. |
| `show_name` | Set to `no`, `false`, `0`, or `off` to hide the name. |
| `show_title` | Same false values hide the title. |
| `show_bio` | Same false values hide the biography. |
| `show_photo` | Same false values hide the photo. |
| `show_company_logo` | Same false values hide the company logo. |
| `theme` | `dark` selects the dark theme; every other value selects light in the client template. The staff CSS is dark by default and supports a light override. |
| `accent` | CSS color for accents. |
| `background` | CSS `--bg` override. |
| `profile_bg` | CSS `--profile-bg` override. |
| `surface` | CSS `--surface` override. |
| `border` | CSS `--border` override. |
| `text` | CSS `--text` override. |
| `muted` | CSS `--muted` override. |
| `action` | CSS `--action` override for Save contact. |

Color values are applied only when `CSS.supports('color', value)` accepts
them. Invalid colors silently retain the template defaults.

In `logo_only` mode, the personal profile area is hidden, the company logo is
enlarged and centered, and only the company logo is forced visible. The Save
contact button is also omitted when `name` is absent because a vCard requires a
contact name.

### Contact and social fields

Supported link types are:

- `phone`
- `email`
- `website`
- `facebook`
- `instagram`
- `tiktok`
- `youtube`
- `linkedin`
- `github` (staff variant)
- `messenger`
- `whatsapp`
- `telegram`
- `viber`
- `location`

The client and staff scripts share the same URL and icon system, but the staff
variant adds GitHub support and exposes a different set of quick actions.

## 6. Link normalization and generated destinations

The `TYPES` map controls labels, icons, and destination URLs:

| Field | Generated destination |
| --- | --- |
| `phone` | `tel:` with whitespace removed |
| `email` | `mailto:` |
| Web/social fields | Existing `http`/`https` URL, otherwise `https://` is prefixed |
| `whatsapp` | Existing HTTP URL, otherwise `https://wa.me/<digits>` |
| `telegram` | Existing HTTP URL, otherwise `https://t.me/<handle>` with a leading `@` removed |
| `viber` | `viber://chat?number=%2B<digits>` |
| `location` | Google Maps search URL with the address URI-encoded |

Phone normalization strips all non-digits. Numbers beginning with `0` are
assumed to be Philippine numbers and are converted to the `63` country code
for WhatsApp and Viber. International numbers should be supplied carefully
because this conversion is intentionally simple.

HTTP links open in a new tab with `rel="noopener"`. Telephone, email, and
custom protocol links remain in the current browsing context.

## 7. Visible interaction model

### QR flip card

The QR button toggles `.is-flipped` on `#profile-inner`. CSS rotates the inner
card by 180 degrees. JavaScript also:

- Updates `aria-pressed`.
- Changes the button's accessible label between “Show QR code” and “Show
  profile”.
- Updates `aria-hidden` on the front and back faces.
- Enables pointer events only on the currently visible face.

### Quick actions

Quick actions are rendered only when the corresponding field has a value.

Client quick actions:

- Phone / Call
- Email
- Facebook
- Viber
- WhatsApp
- Telegram

Staff quick actions:

- Phone / Call
- Email
- Facebook
- Telegram
- Website
- Instagram
- LinkedIn
- GitHub

The remaining supported fields are rendered in the full link list instead of
the quick-action row. This prevents a link from appearing twice in the same
section.

### Full link list

The full list is generated from configured supported fields. Empty or unknown
fields are skipped. Each entry contains an icon and a label. For most links it
also shows the original configured value below the label.

Phone and email entries display the value as the main label and include a
`Copy` button. The button uses the browser Clipboard API and temporarily
changes to `Copied` after success.

The share control is inserted when the `phone` field is processed. It shares
the current profile URL using the native Web Share API when available. If Web
Share is unavailable, it copies the URL to the clipboard and temporarily
changes its label to `Link copied`.

Because the share control is currently created inside the `phone` branch, a
profile without a `phone` field does not receive a Share profile button. This
is an implementation behavior to account for when preparing a profile.

## 8. Save contact and vCard behavior

The Save contact button is enabled only when `name` is present.

For most browsers:

1. A vCard 3.0 string is generated in the browser.
2. The name is split into given and family components.
3. Available company, title, phone, email, website, social URLs, messaging
   URLs, and work address fields are added.
4. A `Blob` is created with MIME type `text/vcard`.
5. A temporary download link downloads `<name>.vcf`.

Values are escaped for vCard line syntax by escaping backslashes, newlines,
commas, and semicolons.

If a `vcard` field is supplied, its value is treated as a static URL/path and
opened instead of generating a vCard. This field is implemented by the
scripts even though it is not listed in the sample `client.txt` files.

On supported Android Chrome user agents, the primary Save contact action uses
an `android.intent.action.INSERT` contact intent. A fallback download link is
then revealed so the user can download the generated vCard if the intent does
not work. Samsung Browser, Opera, Edge Android, Firefox, and several embedded
social-app browsers are excluded from this special path.

The generated vCard deliberately uses generic `URL` entries for several
social and messaging values. It does not preserve the custom display labels
from `client.txt`.

## 9. Visual system

### Client template

The client stylesheet is a light neumorphic/card-oriented design:

- Maximum content width is approximately 420px.
- The profile card uses a pale blue-gray background and rounded 18px corners.
- Contact links use white surfaces with borders.
- Quick actions use a three-column layout.
- The card uses a subtle fixed noise overlay.
- The dark theme variables are available through `data-theme="dark"`.

### Staff template

The staff stylesheet is a darker glassmorphism design:

- Maximum content width is approximately 440px.
- The profile card uses translucent surfaces, blur, gradients, and large
  rounded corners.
- The page background includes blurred atmospheric color orbs.
- Quick actions use a four-column layout with per-service accent colors.
- The card has a larger minimum height and more spacious visual treatment.
- A mobile breakpoint at 420px reduces padding, card radius, and image sizing.

Both variants use CSS custom properties so client-specific colors can be
configured without changing the stylesheet.

## 10. Creating and deploying a profile

1. Duplicate the desired template folder.
2. Rename the copy for the client or staff member.
3. Replace values in `client.txt`.
4. Replace `assets/profile-photo.svg`, `assets/company-logo.svg`, and
   `assets/qr-code.svg` with the final assets. PNG, JPG, and WebP are supported
   for photos; other image formats work when supported by the browser.
5. Update the corresponding paths in `client.txt` if filenames or extensions
   changed.
6. Test through a local HTTP server.
7. Test on both mobile and desktop widths.
8. Test phone, email, social links, messaging links, copy buttons, Share
   profile, Save contact, QR flipping, and scanning the QR code from another
   device.
9. Generate the production QR code only after the final public URL is known.
10. Deploy the folder contents to a static host such as Vercel, Netlify,
    GitHub Pages, or another host that serves static files.

The QR image must be regenerated if the public URL changes after deployment.

## 11. Maintenance and extension points

For normal content changes, edit only `client.txt` and the assets.

To add a new link type:

1. Add its SVG path to `ICONS` in the relevant `script.js`.
2. Add its label, icon key, and URL builder to `TYPES`.
3. Decide whether it belongs in `setupQuickActions`.
4. Add it to `quickActionKeys` if it should not also appear in the full list.
5. Add it to the vCard generation logic if it should be exported.
6. Update the relevant template README and this document.
7. Test empty values, malformed URLs, mobile behavior, external-link
   handling, and contact export.

The client and staff scripts are nearly parallel but are not identical. When
fixing shared behavior, apply the change to both scripts and compare their
variant-specific action lists before testing.

## 12. Known implementation details and cautions

- There is no build process or dependency installation step.
- `client.txt` is public and must contain only information intended for public
  display.
- A static host must serve `client.txt`; deploying only `index.html` and the
  compiled-looking assets will produce an empty/default profile.
- `company` is used for accessibility, document metadata, and vCards, but is
  not displayed as a standalone visible text element.
- A title link affects both the title and company-logo destination.
- The share button currently depends on a `phone` entry being present.
- Clipboard actions require browser clipboard support and may be restricted by
  browser security context or permissions.
- The Android intent path is user-agent based and should always be tested on
  real devices.
- The QR assets shipped in the templates are placeholders, not valid
  production destinations.
- Unknown keys are ignored, making the data file extensible but also making
  spelling mistakes easy to miss.
- Invalid custom colors retain defaults rather than producing a visible error.

## 13. Operational checklist

Before publishing a profile, verify:

- [ ] The folder contains `index.html`, `script.js`, `style.css`,
      `client.txt`, and `assets/`.
- [ ] `client.txt` has no placeholder names, URLs, phone numbers, or handles.
- [ ] All configured image paths exist and load.
- [ ] The real QR code points to the final public URL.
- [ ] The profile loads over HTTP(S), not only from a local `file://` URL.
- [ ] The title, logo, photo, bio, and location render as intended.
- [ ] Empty optional fields do not create empty cards.
- [ ] External links open safely and point to the intended destinations.
- [ ] Phone and email copy buttons work.
- [ ] Share profile works through Web Share or clipboard fallback.
- [ ] Save contact works on desktop, iOS, and Android Chrome where applicable.
- [ ] The QR card flips in both directions and remains accessible.
- [ ] The layout is usable at narrow mobile widths.
- [ ] No private data or secrets have been added to the public folder.
