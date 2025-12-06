import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "693305cd360c21c735070add", 
  requiresAuth: true // Ensure authentication is required for all operations
});
