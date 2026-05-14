/**
 * base44Client.js — shim, redirects to our FastAPI client.
 * Every component that does `import { base44 } from '@/api/base44Client'`
 * gets our real implementation with zero changes needed.
 */
export { base44, base44 as default } from './apiClient';
