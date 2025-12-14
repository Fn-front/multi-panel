import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ダミーのstream_eventsを削除
    const { error: eventsError, count: eventsCount } = await supabase
      .from('stream_events')
      .delete({ count: 'exact' })
      .like('video_id', 'dummy_video_%');

    if (eventsError) {
      throw eventsError;
    }

    // ダミーのfavorite_channelsを削除
    const { error: channelsError, count: channelsCount } = await supabase
      .from('favorite_channels')
      .delete({ count: 'exact' })
      .like('channel_id', 'UC_test_channel_%');

    if (channelsError) {
      throw channelsError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          stream_events: eventsCount,
          favorite_channels: channelsCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting dummy data:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
