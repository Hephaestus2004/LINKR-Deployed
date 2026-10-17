// Keep admin API calls under /admin so Cloudflare Access uses the same
// authenticated application session as the admin console page.
export { onRequestGet, onRequestPost, onRequestDelete } from '../../../api/admin/profiles';
