// Export all middlewares from a single file for easier imports
export { authenticateToken, requireAdmin, requireOwnershipOrAdmin } from './auth';
