# Client contact profile template

This folder is a reusable starting point for a Linkr-style digital contact page.
It contains the working profile card, QR-code flip card, quick contact actions,
copy buttons, share action, and downloadable vCard behavior from the Jomel
Bacod project, but uses neutral placeholder content.

## Create a new client profile

1. Duplicate this entire `client-template` folder and rename it for the client.
2. Replace the values in [`client.txt`](./client.txt). The page reads this file
   at runtime, so most client changes do not require editing HTML, CSS, or JS.
3. Replace the three files in [`assets/`](./assets/) with the client's files:
   - `profile-photo.svg` can be replaced with `profile-photo.jpg` or `.png`.
   - `company-logo.svg` can be replaced with the company logo image.
   - `qr-code.svg` can be replaced with a QR image pointing to the final page.
4. Update the matching `photo`, `company_logo`, and `qr_code` paths in
   `client.txt` if the file names or extensions change.
5. Open `index.html` through a local web server or deploy the folder to a
   static host. Do not open it directly with `file://`; browsers block the
   `client.txt` request in that mode.

## Supported fields

Each line follows `key: value`. Add ` | Label` to show a custom label for
fields such as `website` and `location`.

| Field | Required | Purpose |
| --- | --- | --- |
| `name` | No | Person's display name and page title |
| `company` | No | Company name used in the vCard and share text |
| `company_logo` | No | Logo image path |
| `title` | No | Job title; becomes a link when `title_link` is present |
| `title_link` | No | Link for the job title and company logo |
| `bio` | No | Optional short description below the job title |
| `photo` | No | Profile image path |
| `qr_code` | No | QR image path |
| `theme` | No | `light` or `dark` |
| `accent` | No | CSS color such as `#6f8fa3` |
| `phone` | No | Phone link, quick action, and vCard number |
| `email` | No | Email link, quick action, and vCard email |
| `website` | No | Website link and vCard URL |
| `facebook`, `instagram`, `tiktok` | No | Social profile links |
| `youtube`, `linkedin`, `messenger` | No | Social or messaging links |
| `viber`, `whatsapp`, `telegram` | No | Messaging links and quick actions |
| `location` | No | Google Maps search link and vCard address |
| `profile_mode` | No | `standard` or `logo_only` |
| `show_name`, `show_title`, `show_bio` | No | Set to `no` to hide that profile text |
| `show_photo`, `show_company_logo` | No | Set to `no` to hide either image |
| `background`, `profile_bg` | No | Page and profile-card background colors |
| `surface`, `border` | No | Contact-link surface and border colors |
| `text`, `muted`, `action` | No | Text, secondary text, and save-button colors |

Blank or removed optional fields are simply omitted from the page. Keep URLs
complete, including `https://`, when possible. Phone numbers may be written
locally or internationally; WhatsApp and Viber links are normalized for
Philippine numbers beginning with `0`.

### Special layouts

For a logo-only client, remove the personal fields and use:

```text
profile_mode: logo_only
company_logo: assets/company-logo.png
title_link: https://client.example
```

The profile card stays intact, centers the larger logo, and keeps any available
quick actions and contact links. The Save contact button is automatically
omitted when there is no `name`, because a vCard needs a contact name.

For a client with only one or two social profiles, keep only those fields:

```text
facebook: https://facebook.com/client
```

The template renders only supplied links; it does not leave empty cards or
broken social icons. Phone, email, messaging, website, and location fields can
be used even when there are no social media accounts.

## Customization checklist

- **Branding:** change `accent` or the optional color fields in `client.txt`.
  Colors are applied only when the browser recognizes them, so invalid values
  safely fall back to the built-in theme.
- **Content:** add or remove supported contact fields in `client.txt`.
- **Assets:** use clear, compressed images. A square profile photo works best;
  logos should have transparent or light backgrounds.
- **QR code:** generate it only after the final public URL is known.
- **Footer:** edit the footer in [`index.html`](./index.html) if the client
  needs a different attribution or legal notice.
- **New link type:** add an icon and URL rule to `ICONS` and `TYPES` in
  [`script.js`](./script.js), then add the field to the vCard list if it should
  be saved to contacts.

## Local preview

From this folder, run one of these commands:

```text
py -m http.server 8000
```

Then visit `http://localhost:8000` and test on both mobile and desktop widths.
Before delivery, test the phone, email, social links, Share profile button,
Save contact button, QR flip card, and the QR code with a second device.

## Deployment

This is a static site and can be deployed to Vercel, Netlify, GitHub Pages, or
any static hosting provider. Upload the contents of this folder as the site
root, including `client.txt` and the `assets` directory. If the public URL
changes after generating the QR code, generate a new QR image and replace the
old one.
