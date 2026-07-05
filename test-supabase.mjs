import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://haqjdrxfoiexccjlcpxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcWpkcnhmb2lleGNjamxjcHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3Mjc0MjMsImV4cCI6MjA4NTMwMzQyM30.rRnruq-mn0aIA5Y17BftIMQmHBU1CfVVSfHOSBQKMbc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing with 21:00');
    const { data: data1 } = await supabase
        .from('blocked_time_slots')
        .select('*')
        .eq('blocked_date', '2026-07-09')
        .in('time_slot', ['21:00']);
    console.log('Found with 21:00:', data1.length);

    console.log('Testing with 21:00:00');
    const { data: data2 } = await supabase
        .from('blocked_time_slots')
        .select('*')
        .eq('blocked_date', '2026-07-09')
        .in('time_slot', ['21:00:00']);
    console.log('Found with 21:00:00:', data2.length);
}

run();
