// Keep the client request admin API under the Cloudflare Access protected path.
export { onRequestGet, onRequestPost } from '../../../api/admin/client-requests';
