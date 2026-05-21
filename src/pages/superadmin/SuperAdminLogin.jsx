import { Lock, Mail, LogIn, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

/**
 * Minimal login page for the Super Admin dashboard at /odc/login.
 * Uses the same dark aesthetic as the SuperAdminLayout.
 * After successful auth, checks is_superadmin before redirecting.
 */
export function SuperAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // If already authenticated as superadmin, redirect to dashboard
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
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
                    navigate('/odc', { replace: true });
                }
            }
        };
        checkAuth();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Verify superadmin status
            let { data: adminRow } = await supabase
                .from('admin_users')
                .select('is_superadmin')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!adminRow && data.user.email === 'superadmin@odc.com') {
                // Automatically provision the admin_users entry for the superadmin
                const { error: insertError } = await supabase
                    .from('admin_users')
                    .insert([{
                        id: data.user.id,
                        email: data.user.email,
                        company_id: 'client_001' // default company to satisfy NOT NULL constraint
                    }]);

                if (insertError) {
                    console.error('Failed to auto-insert superadmin into admin_users:', insertError);
                    throw new Error('Access denied. Failed to initialize super admin record.');
                }

                const { data: newAdminRow } = await supabase
                    .from('admin_users')
                    .select('is_superadmin')
                    .eq('id', data.user.id)
                    .maybeSingle();
                adminRow = newAdminRow;
            }

            if (!adminRow?.is_superadmin) {
                await supabase.auth.signOut();
                throw new Error('Access denied. Super admin privileges required.');
            }

            navigate('/odc', { replace: true });
        } catch (err) {
            setError(err.message || 'Authentication failed.');
            console.error('Super admin auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/[0.06] rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 bg-[#111113] rounded-2xl border border-white/[0.08] p-8 w-full max-w-md shadow-2xl shadow-black/40">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-gradient-to-br from-violet-500 to-fuchsia-600 w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg shadow-violet-500/20 mb-4">
                        <Shield size={24} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-white">
                        Platform Admin
                    </h1>
                    <p className="text-white/40 mt-2 text-sm font-medium">
                        Sign in with your super admin credentials.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-white/50 mb-1.5">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                                placeholder="superadmin@odc.com"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-white/50 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 outline-none focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10 transition-all"
                                placeholder="Enter password"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/[0.1] border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <LogIn size={16} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
