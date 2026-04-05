import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Trophy, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

interface AuthScreenProps {
    onAuthSuccess: () => void;
}

const LOGO_URL = 'https://i.postimg.cc/fRdWdn9t/20251127-224320.png';

// ─── Reusable Input ───────────────────────────────────────────────────────────
const InputField = ({
    id, label, type = 'text', value, onChange, placeholder, icon: Icon, rightElement, error,
}: {
    id: string; label: string; type?: string; value: string;
    onChange: (v: string) => void; placeholder: string;
    icon: React.ElementType; rightElement?: React.ReactNode; error?: string;
}) => (
    <div className="space-y-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-300">
            {label}
        </label>
        <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
                id={id}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full pl-10 pr-10 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 ${error ? 'border-red-400 bg-red-500/10' : 'border-white/10 hover:border-white/20 focus:bg-white/8'
                    }`}
            />
            {rightElement && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
            )}
        </div>
        {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
            </p>
        )}
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearState = (newMode: AuthMode) => {
        setMode(newMode);
        setErrorMsg('');
        setSuccessMsg('');
        setErrors({});
        setPassword('');
        setConfirmPassword('');
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
        if (mode !== 'FORGOT') {
            if (!password) newErrors.password = 'Password is required';
            else if (password.length < 6) newErrors.password = 'At least 6 characters required';
        }
        if (mode === 'SIGNUP') {
            if (!name.trim()) newErrors.name = 'Name is required';
            if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (mode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuthSuccess();
            } else if (mode === 'SIGNUP') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } },
                });
                if (error) throw error;
                // Create profile row immediately
                if (data.user) {
                    await supabase.from('user_profiles').upsert({
                        id: data.user.id,
                        name,
                        email,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff&size=200`,
                        updated_at: new Date().toISOString(),
                    });
                }
                // Email confirmation may or may not be required
                if (data.session) {
                    onAuthSuccess();
                } else {
                    setSuccessMsg('Account created! Check your email to confirm your account, then log in.');
                    clearState('LOGIN');
                }
            } else if (mode === 'FORGOT') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) throw error;
                setSuccessMsg('Password reset link sent! Check your inbox.');
            }
        } catch (err: unknown) {
            const msg = (err as Error).message || 'Something went wrong. Please try again.';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative overflow-hidden rounded-2xl bg-slate-900 py-10 px-4 flex flex-col items-center"
            style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c2340 70%, #0f172a 100%)',
            }}
        >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500 rounded-full blur-[150px] opacity-5" />
                {/* Cricket field lines (decorative) */}
                <div className="absolute bottom-0 left-0 right-0 h-64 opacity-5"
                    style={{
                        background: 'repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 80px, #fff 80px)',
                    }}
                />
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md opacity-40" />
                            <img
                                src={LOGO_URL}
                                alt="ARcricinfo"
                                className="relative w-16 h-16 rounded-full border-2 border-yellow-400/60 object-cover shadow-xl"
                                onError={e => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const next = (e.target as HTMLImageElement).nextElementSibling;
                                    if (next) (next as HTMLElement).style.display = 'flex';
                                }}
                            />
                            <div className="hidden w-16 h-16 rounded-full bg-yellow-400/20 border-2 border-yellow-400/60 items-center justify-center">
                                <Trophy className="w-8 h-8 text-yellow-400" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">ARcricinfo</h1>
                            <p className="text-yellow-400 text-xs font-semibold tracking-widest uppercase">
                                Pro Cricket Platform
                            </p>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm">
                        {mode === 'LOGIN' && 'Welcome back! Sign in to your account.'}
                        {mode === 'SIGNUP' && 'Create your account and start scoring.'}
                        {mode === 'FORGOT' && "No worries, we'll send you reset instructions."}
                    </p>
                </div>

                {/* Glass card */}
                <div
                    className="rounded-2xl p-8 shadow-2xl"
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Mode tabs (Login / Signup) */}
                    {mode !== 'FORGOT' && (
                        <div className="flex bg-white/5 rounded-xl p-1 mb-8 border border-white/5">
                            {(['LOGIN', 'SIGNUP'] as AuthMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => clearState(m)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${mode === m
                                            ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-400/20'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {m === 'LOGIN' ? 'Sign In' : 'Sign Up'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Back button for forgot */}
                    {mode === 'FORGOT' && (
                        <button
                            onClick={() => clearState('LOGIN')}
                            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" /> Back to Sign In
                        </button>
                    )}

                    {/* Success / Error banners */}
                    {successMsg && (
                        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-green-300 text-sm">{successMsg}</p>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{errorMsg}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'SIGNUP' && (
                            <InputField
                                id="name" label="Full Name" value={name}
                                onChange={setName} placeholder="e.g. Virat Kohli"
                                icon={User} error={errors.name}
                            />
                        )}

                        <InputField
                            id="email" label="Email Address" type="email" value={email}
                            onChange={setEmail} placeholder="you@example.com"
                            icon={Mail} error={errors.email}
                        />

                        {mode !== 'FORGOT' && (
                            <InputField
                                id="password" label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password} onChange={setPassword}
                                placeholder="••••••••"
                                icon={Lock}
                                error={errors.password}
                                rightElement={
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="text-slate-400 hover:text-white transition-colors">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        )}

                        {mode === 'SIGNUP' && (
                            <InputField
                                id="confirmPassword" label="Confirm Password"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword} onChange={setConfirmPassword}
                                placeholder="••••••••"
                                icon={Lock}
                                error={errors.confirmPassword}
                                rightElement={
                                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                                        className="text-slate-400 hover:text-white transition-colors">
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                }
                            />
                        )}

                        {mode === 'LOGIN' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => clearState('FORGOT')}
                                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 rounded-xl font-bold text-slate-900 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            style={{
                                background: loading
                                    ? '#ca8a04'
                                    : 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)',
                                boxShadow: '0 4px 24px rgba(250,204,21,0.25)',
                            }}
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Please wait...</>
                            ) : (
                                <>
                                    {mode === 'LOGIN' && 'Sign In'}
                                    {mode === 'SIGNUP' && 'Create Account'}
                                    {mode === 'FORGOT' && 'Send Reset Link'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider + mode switch */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            {mode === 'LOGIN' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                onClick={() => clearState(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
                                className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
                            >
                                {mode === 'LOGIN' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2025 ARcricinfo · Professional Cricket Platform
                </p>
            </div>
        </div>
    );
};
