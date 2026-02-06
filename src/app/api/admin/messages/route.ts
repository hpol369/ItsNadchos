import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasValidAdminSession, getSessionCookieName } from '@/lib/admin-auth';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, rateLimitHeaders } from '@/lib/ratelimit';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  // Check rate limit
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`admin:${clientId}`, RATE_LIMITS.admin);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(rateLimit) }
    );
  }

  // Verify admin authentication
  const sessionCookie = request.cookies.get(getSessionCookieName());
  const isAuthenticated = await hasValidAdminSession(sessionCookie?.value);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate query parameters
  const { adminMessagesSchema, validateQuery } = await import('@/lib/validation');
  const validationResult = validateQuery(
    adminMessagesSchema,
    request.nextUrl.searchParams
  );

  if (!validationResult.success) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  const { userId } = validationResult.data;

  try {
    const supabase = getSupabase();

    // Get all messages for this user
    const { data: messages, error } = await supabase
      .from('nacho_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Get user info
    const { data: user } = await supabase
      .from('nacho_users')
      .select('display_name, username, telegram_id, total_messages, created_at')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      messages: messages || [],
      user: user || null,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
