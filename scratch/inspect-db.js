import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        envConfig[key] = val;
    }
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    try {
        const targetDate = '2026-06-01';
        console.log(`Summary of bookings on: ${targetDate}`);

        const { data: bookings, error: bError } = await supabase
            .from('bookings')
            .select('court_id, start_time, end_time, booked_times, status, courts(name, type)')
            .eq('booking_date', targetDate)
            .in('status', ['Confirmed', 'Rescheduled']);

        if (bError) {
            console.error('Error:', bError);
            return;
        }

        bookings.forEach((b, idx) => {
            console.log(`${idx + 1}. Court: ${b.courts?.name} (${b.courts?.type}), Time: ${b.start_time} - ${b.end_time}, Booked Slots: ${JSON.stringify(b.booked_times)}, Status: ${b.status}`);
        });

        console.log('Total bookings found:', bookings.length);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

inspect();
