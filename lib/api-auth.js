// lib/api-auth.js
// API authentication middleware for panel routes

import { getAccessList } from './access-db.js';

/**
 * Validates panel authentication from request headers
 * @param {Request} request - The incoming request
 * @param {string[]} requiredPanels - Required panel permissions (optional, defaults to any panel access)
 * @returns {Promise<{authorized: boolean, error?: string, panels?: string[]}>}
 */
export async function validatePanelAuth(request, requiredPanels = []) {
  try {
    // Get panel code from Authorization header or x-panel-code header
    const authHeader = request.headers.get('authorization');
    const panelCodeHeader = request.headers.get('x-panel-code');
    
    let panelCode = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      panelCode = authHeader.substring(7);
    } else if (panelCodeHeader) {
      panelCode = panelCodeHeader;
    }
    
    if (!panelCode) {
      return { authorized: false, error: 'Missing panel code' };
    }
    
    // Get access list and validate code
    const accessList = await getAccessList();
    const found = accessList.find(item => item.code === panelCode);
    
    if (!found) {
      return { authorized: false, error: 'Invalid panel code' };
    }
    
    const panels = found.panels || [];
    
    // Check if user has required panels
    let authorized = false;
    if (requiredPanels.length === 0) {
      // Any panel access is sufficient
      authorized = panels.length > 0;
    } else {
      // Must have at least one of the required panels
      authorized = requiredPanels.some(p => panels.includes(p));
    }
    
    if (!authorized) {
      return { authorized: false, error: 'Insufficient permissions' };
    }
    
    return { authorized: true, panels };
  } catch (error) {
    console.error('[api-auth] Validation error:', error);
    return { authorized: false, error: 'Authentication failed' };
  }
}

/**
 * Creates an authenticated API response helper
 * @param {Request} request
 * @param {string[]} requiredPanels
 * @returns {Promise<{authorized: boolean, errorResponse?: Response, panels?: string[]}>}
 */
export async function withPanelAuth(request, requiredPanels = []) {
  const result = await validatePanelAuth(request, requiredPanels);
  
  if (!result.authorized) {
    return {
      authorized: false,
      errorResponse: new Response(
        JSON.stringify({ error: result.error || 'Unauthorized' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    };
  }
  
  return { authorized: true, panels: result.panels };
}