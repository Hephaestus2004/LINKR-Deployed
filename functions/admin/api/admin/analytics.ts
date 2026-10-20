// Keep admin API calls under /admin so Cloudflare Access uses the same session.
export { onRequestGet } from '../../../api/admin/analytics';
