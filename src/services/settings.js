import { supabase } from '../lib/supabaseClient';
import { getCompanyId } from '../lib/config';

export async function getTenantSettings() {
    const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('company_id', getCompanyId())
        .maybeSingle();

    if (error) {
        console.error('Error fetching tenant settings:', error);
        throw error;
    }

    return data;
}

export async function updateTenantSettings(updates) {
    const { data, error } = await supabase
        .from('tenant_settings')
        .upsert({
            company_id: getCompanyId(),
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' })
        .select()
        .single();

    if (error) {
        console.error('Error updating tenant settings:', error);
        throw error;
    }

    return data;
}
