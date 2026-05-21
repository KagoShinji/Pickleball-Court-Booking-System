import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Route guard for the Super Admin dashboard (/odc).
 * Checks if the currently authenticated user has `is_superadmin = true`
 * in the admin_users table. If not, redirects to a 404-style dead end
 * (not the admin login) to keep the route hidden from regular users.
 */
export function SuperAdminRoute() {
    const navigate = useNavigate();
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSuperAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    navigate('/odc/login', { replace: true });
                    return;
                }

                let { data: adminRow } = await supabase
                    .from('admin_users')
                    .select('is_superadmin')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!adminRow && user.email === 'superadmin@odc.com') {
                    // Automatically provision the admin_users entry for the superadmin
                    const { error: insertError } = await supabase
                        .from('admin_users')
                        .insert([{
                            id: user.id,
                            email: user.email,
                            company_id: 'client_001' // default company to satisfy NOT NULL constraint
                        }]);

                    if (!insertError) {
                        const { data: newAdminRow } = await supabase
                            .from('admin_users')
                            .select('is_superadmin')
                            .eq('id', user.id)
                            .maybeSingle();
                        adminRow = newAdminRow;
                    }
                }

                if (adminRow?.is_superadmin) {
                    setAuthorized(true);
                } else {
                    // Render a generic 404 to hide the route's existence
                    navigate('/404', { replace: true });
                }
            } catch {
                navigate('/404', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        checkSuperAdmin();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-center">
                    <div className="inline-block animate-spin">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!authorized) return null;

    return <Outlet />;
}
