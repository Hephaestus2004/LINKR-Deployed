// Keep admin API calls under /admin so Cloudflare Access uses the same
// authenticated application session as the admin console page.
export { onRequestGet, onRequestPost } from '../../../api/admin/batches';
