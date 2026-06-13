const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
} catch (err) {
  console.error("Could not read .env file:", err);
}

const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return match ? match[1] : null;
};

const supabaseUrl = getEnvVal('VITE_SUPABASE_URL') || "https://haqjdrxfoiexccjlcpxk.supabase.co";
const supabaseKey = getEnvVal('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching latest security incident logs...");
  const { data, error } = await supabase
    .from('security_incident_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching logs:", error);
    return;
  }

  console.log("Latest logs:");
  data.forEach((log, index) => {
    console.log(`\n--- Log #${index + 1} ---`);
    console.log(`ID: ${log.id}`);
    console.log(`Created At: ${log.created_at}`);
    console.log(`Incident Type: ${log.incident_type}`);
    console.log(`Attempted Ref: ${log.attempted_reference_no}`);
    console.log(`Raw OCR Output:\n${log.raw_ocr_output}`);
  });
}

run();
