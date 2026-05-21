import { BarChart3, LayoutDashboard, LogOut, Menu, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * SuperAdminLayout — a dedicated layout for the /odc Super Admin dashboard.
 * Uses a dark Vercel-like SaaS aesthetic, completely separate from the
 * tenant admin layout. Features a minimal sidebar and top bar.
 */
export function SuperAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/admin');
    };

    const navItems = [
        { path: '/odc', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ];

    return (
        <div className="min-h-screen bg-[#09090b] font-sans flex text-white">
            {/* ── Desktop Sidebar ── */}
            <aside className="w-64 bg-[#0f0f11] border-r border-white/[0.06] fixed top-0 bottom-0 left-0 z-50 hidden md:flex flex-col">
                {/* Brand */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/[0.06]">
                    <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
                        <Shield size={18} className="text-white" />
                    </div>
                    <div>
                        <span className="font-display font-bold text-sm text-white tracking-wide">ODC Platform</span>
                        <span className="block text-[10px] font-semibold text-white/40 tracking-widest uppercase">Super Admin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Navigation</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                ${isActive
                                    ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'}
                            `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-white/[0.06]">
                    <div className="mb-3 px-3 py-2.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Signed in as</p>
                        <p className="text-sm font-medium text-white/70 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 cursor-pointer"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Mobile Header ── */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0f0f11]/95 backdrop-blur-xl border-b border-white/[0.06] z-50 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-1.5 rounded-lg">
                        <Shield size={14} className="text-white" />
                    </div>
                    <span className="font-display font-bold text-sm text-white">ODC Platform</span>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* ── Mobile Menu Overlay ── */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute top-14 left-0 right-0 bg-[#0f0f11] border-b border-white/[0.06] p-4 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <nav className="space-y-1 mb-4">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors
                                        ${isActive
                                            ? 'bg-white/[0.08] text-white'
                                            : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'}
                                    `}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                        <div className="pt-4 border-t border-white/[0.06]">
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-base font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Content ── */}
            <main className="flex-1 md:ml-64 p-4 sm:p-8 pt-18 md:pt-8 min-w-0 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
}
