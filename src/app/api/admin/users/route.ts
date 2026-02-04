import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // Get all users with their latest message
    const { data: users, error } = await supabase
      .from('nacho_users')
      .select(`
        id,
        telegram_id,
        username,
        display_name,
        first_name,
        total_messages,
        is_blocked,
        created_at,
        last_active_at
      `)
      .order('last_active_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get latest message for each user
    const usersWithLastMessage = await Promise.all(
      (users || []).map(async (user) => {
        const { data: lastMessage } = await supabase
          .from('nacho_messages')
          .select('content, role, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...user,
          last_message: lastMessage?.content?.substring(0, 50) || null,
          last_message_role: lastMessage?.role || null,
          last_message_at: lastMessage?.created_at || null,
        };
      })
    );

    return NextResponse.json({ users: usersWithLastMessage });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
