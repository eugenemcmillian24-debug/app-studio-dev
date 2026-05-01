import { describe, it, expect } from 'vitest';
import https from 'https';

/**
 * Test Supabase integration and credentials
 */
describe('Supabase Integration', () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  it('should have Supabase credentials configured', () => {
    expect(supabaseUrl).toBeDefined();
    expect(anonKey).toBeDefined();
    expect(serviceRoleKey).toBeDefined();
  });

  it('should have valid Supabase URL format', () => {
    expect(supabaseUrl).toMatch(/^https:\/\/[\w-]+\.supabase\.co$/);
  });

  it('should have valid JWT tokens', () => {
    // JWT format: header.payload.signature
    const jwtRegex = /^eyJ[\w-]*\.eyJ[\w-]*\.[\w-]*$/;
    expect(anonKey).toMatch(jwtRegex);
    expect(serviceRoleKey).toMatch(jwtRegex);
  });

  it('should be able to connect to Supabase API', async () => {
    return new Promise((resolve, reject) => {
      const url = new URL(`${supabaseUrl}/rest/v1/`);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        // Supabase returns 200 or 401 for valid credentials
        // 404 means invalid URL, 403 means invalid token
        if (res.statusCode === 200 || res.statusCode === 401) {
          resolve(true);
        } else {
          reject(new Error(`Unexpected status: ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  });

  it('should decode anon key and verify claims', () => {
    // Decode JWT payload (without verification)
    const parts = anonKey!.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    expect(payload.iss).toBe('supabase');
    expect(payload.role).toBe('anon');
    expect(payload.ref).toBe('hjbstamixbrkkftqdnnh');
  });

  it('should decode service role key and verify claims', () => {
    // Decode JWT payload (without verification)
    const parts = serviceRoleKey!.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    expect(payload.iss).toBe('supabase');
    expect(payload.role).toBe('service_role');
    expect(payload.ref).toBe('hjbstamixbrkkftqdnnh');
  });

  it('should have matching project references in both keys', () => {
    const anonParts = anonKey!.split('.');
    const anonPayload = JSON.parse(Buffer.from(anonParts[1], 'base64').toString());
    
    const roleParts = serviceRoleKey!.split('.');
    const rolePayload = JSON.parse(Buffer.from(roleParts[1], 'base64').toString());
    
    expect(anonPayload.ref).toBe(rolePayload.ref);
  });
});
