import { supabase } from '../lib/supabaseClient';

export async function getTenantSettings() {
    const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error fetching tenant settings:', error);
        throw error;
    }

    return data;
}

export async function updateTenantSettings(updates) {
    const { data, error } = await supabase
        .from('tenant_settings')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)
        .select()
        .single();

    if (error) {
        console.error('Error updating tenant settings:', error);
        throw error;
    }

    return data;
}
