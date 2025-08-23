// Minimal registration endpoint for debugging
export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  
  try {
    console.log('=== SIMPLE REGISTER ENDPOINT ===');
    console.log('Environment keys available:', Object.keys(env));
    console.log('JWT_SECRET exists:', !!env.JWT_SECRET);
    console.log('JWT_SECRET type:', typeof env.JWT_SECRET);
    console.log('JWT_SECRET length:', env.JWT_SECRET?.length || 0);
    
    // Basic environment check
    if (!env.JWT_SECRET) {
      console.log('Missing JWT_SECRET');
      return new Response(JSON.stringify({
        success: false,
        error: { 
          message: 'Missing JWT_SECRET',
          availableKeys: Object.keys(env),
          debug: {
            hasJWTSecret: !!env.JWT_SECRET,
            jwtSecretType: typeof env.JWT_SECRET
          }
        }
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!env.DB) {
      console.log('Missing DB');
      return new Response(JSON.stringify({
        success: false,
        error: { message: 'Missing DB' }
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Test DB connection
    try {
      const testResult = await env.DB.prepare('SELECT 1 as test').first();
      console.log('DB test result:', testResult);
    } catch (dbError) {
      console.error('DB connection error:', dbError);
      return new Response(JSON.stringify({
        success: false,
        error: { message: 'DB connection failed', details: dbError.message }
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Parse request
    const data = await request.json();
    console.log('Received data:', { firstName: data.firstName, email: data.email, hasPassword: !!data.password });
    
    if (!data.firstName || !data.email || !data.password) {
      return new Response(JSON.stringify({
        success: false,
        error: { message: 'Missing required fields' }
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Registration endpoint is working!',
      data: {
        firstName: data.firstName,
        email: data.email,
        environmentCheck: {
          hasJWT: !!env.JWT_SECRET,
          hasDB: !!env.DB,
          hasPromptCache: !!env.PROMPT_CACHE
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Simple registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      success: false,
      error: { 
        message: 'Simple registration failed',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack'
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};