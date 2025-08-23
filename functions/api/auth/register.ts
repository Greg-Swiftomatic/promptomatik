import { SecurityHeadersManager } from '../../../lib/security.js';

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Hash password using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate JWT token
async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '');

  const message = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, c => c === '+' ? '-' : '_')
    .replace(/=/g, '');

  return `${message}.${signatureB64}`;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    console.log('=== USER REGISTRATION ENDPOINT ===');
    
    // Basic environment check
    if (!env.JWT_SECRET) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'JWT configuration missing'
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }
    
    if (!env.DB) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Database configuration missing'
        }
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }
    
    // Parse and validate request
    const data = await request.json();
    
    if (!data.firstName || !data.email || !data.password) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: firstName, email, password'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(data.email).first();

    if (existingUser) {
      const errorResponse = new Response(JSON.stringify({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
      return SecurityHeadersManager.addSecurityHeaders(errorResponse);
    }

    // Create new user
    const userId = generateUUID();
    const hashedPassword = await hashPassword(data.password);

    await env.DB.prepare(`
      INSERT INTO users (id, first_name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(userId, data.firstName, data.email, hashedPassword).run();

    console.log('User created successfully:', userId);

    // Generate JWT token
    const tokenPayload = {
      userId,
      email: data.email,
      firstName: data.firstName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = await generateJWT(tokenPayload, env.JWT_SECRET);

    const response = new Response(JSON.stringify({
      success: true,
      user: {
        id: userId,
        firstName: data.firstName,
        email: data.email
      },
      token
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

    return SecurityHeadersManager.addSecurityHeaders(response);
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    const errorResponse = new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return SecurityHeadersManager.addSecurityHeaders(errorResponse);
  }
};