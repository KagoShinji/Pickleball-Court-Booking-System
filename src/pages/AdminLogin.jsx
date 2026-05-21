import { Lock, Mail, UserPlus, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { signIn, signUp } from '../services/auth';
import { useCompany } from '../lib/CompanyProvider';

export function AdminLogin() {
    const { company } = useCompany();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if already logged in
        const checkAuth = async () => {
            const { data } = await import('../lib/supabaseClient').then(m => m.supabase.auth.getSession());
            if (data?.session) {
                navigate('/admin/dashboard');
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

        if (isSignUp && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
                // After signup, they are automatically logged in by Supabase Auth
                navigate('/admin/dashboard');
            } else {
                await signIn(email, password);
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please check your credentials.');
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-user p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-gray-100 transition-all duration-300">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-secondary w-16 h-16 flex items-center justify-center rounded-2xl shadow-md mb-4 transition-transform hover:scale-105">
                        <span className="text-white font-bold text-xl">{company.initials || 'CO'}</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-primary-dark">
                        {company.shortName || 'Company'} Admin
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        {isSignUp 
                            ? 'Register a new administrator account for this tenant.' 
                            : 'Welcome back! Please enter your details to sign in.'
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                                placeholder="Enter password"
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {isSignUp && (
                        <div className="animate-in fade-in duration-200">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
                                    placeholder="Confirm password"
                                    required={isSignUp}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold animate-shake">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full text-white" size="lg" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
                                {isSignUp ? 'Register Account' : 'Sign In'}
                            </span>
                        )}
                    </Button>
                </form>

                <div className="text-center mt-6 text-sm text-gray-500">
                    {isSignUp ? (
                        <p>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(false);
                                    setError('');
                                }}
                                className="text-primary hover:underline font-bold focus:outline-none cursor-pointer"
                            >
                                Sign In
                            </button>
                        </p>
                    ) : (
                        <p>
                            Need an admin account?{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(true);
                                    setError('');
                                }}
                                className="text-primary hover:underline font-bold focus:outline-none cursor-pointer"
                            >
                                Register here
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

