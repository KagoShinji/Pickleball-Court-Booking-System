const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
} catch (err) {
  try {
    envContent = fs.readFileSync(path.join(__dirname, '../.env.pickletest'), 'utf8');
  } catch (err2) {
    console.error("Could not read .env file:", err2);
  }
}

const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`${key}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return match ? match[1] : null;
};

const supabaseUrl = getEnvVal('VITE_SUPABASE_URL') || "https://haqjdrxfoiexccjlcpxk.supabase.co";
const supabaseKey = getEnvVal('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenants() {
    console.log('Fetching all tenants...');
    const { data, error } = await supabase
        .from('tenants')
        .select('id, name, features');
        
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Tenants features:');
    console.log(JSON.stringify(data, null, 2));
}

checkTenants();
