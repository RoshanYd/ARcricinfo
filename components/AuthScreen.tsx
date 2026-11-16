import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { saveProfile } from '../utils/db';
import { Trophy, Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, AlertCircle, RotateCcw, Phone, Smartphone } from 'lucide-react';

// Google "G" SVG icon
const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
);

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT' | 'OTP_VERIFY' | 'RESET_PASSWORD';
type AuthMethod = 'EMAIL' | 'MOBILE';

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

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [authMethod, setAuthMethod] = useState<AuthMethod>('MOBILE');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [mockOtpValue, setMockOtpValue] = useState<string>('');

    const clearState = (newMode: AuthMode) => {
        setMode(newMode);
        setErrorMsg('');
        setSuccessMsg('');
        setErrors({});
        setPassword('');
        setConfirmPassword('');
        setOtp('');
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        
        if (mode === 'OTP_VERIFY') {
            if (!otp) newErrors.otp = 'OTP is required';
            else if (otp !== mockOtpValue) newErrors.otp = 'Invalid OTP';
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        }
        
        if (authMethod === 'EMAIL') {
            if (!email.trim()) newErrors.email = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
        } else {
            if (!mobile.trim()) newErrors.mobile = 'Mobile is required';
            else if (!/^\d{10}$/.test(mobile.replace(/[^0-9]/g, ''))) newErrors.mobile = 'Enter a valid 10-digit number';
        }

        if (mode === 'LOGIN' || mode === 'RESET_PASSWORD' || (mode === 'SIGNUP' && authMethod === 'EMAIL')) {
            if (!password) newErrors.password = 'Password is required';
            else if (password.length < 6) newErrors.password = 'At least 6 characters required';
        }

        if (mode === 'SIGNUP' || mode === 'RESET_PASSWORD') {
            if (mode === 'SIGNUP' && !name.trim()) newErrors.name = 'Name is required';
            if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateMockAuthEmail = () => {
        return authMethod === 'EMAIL' ? email : `${mobile}@mock-mobile.arcricinfo.com`;
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
            // Supabase will redirect to Google — no further action needed here
        } catch (err: any) {
            setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
            setGoogleLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!validate()) return;
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            // Mock OTP generation
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setMockOtpValue(generatedOtp);
            console.log(`MOCK OTP for ${mobile}:`, generatedOtp);
            
            // In a real app, you would use supabase.auth.signInWithOtp({ phone: mobile })
            setTimeout(() => {
                setLoading(false);
                setSuccessMsg(`Mock OTP sent to ${mobile}: ${generatedOtp}`);
                setMode('OTP_VERIFY');
            }, 800);

        } catch (err: any) {
            setErrorMsg(err.message || 'Error sending OTP');
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!validate()) return;
        setLoading(true);
        setErrorMsg('');
        
        try {
            // Mock OTP Verification -> Register or Login
            const mockEmail = generateMockAuthEmail();
            
            if (mode === 'OTP_VERIFY') {
                // Determine if we were signing up or logging in or resetting password
                // Since this is mock OTP, we just enforce the signup/login via dummy email
                
                // Let's check if the user exists
                let { error } = await supabase.auth.signInWithPassword({
                    email: mockEmail,
                    password: 'MOCK_MOBILE_PASSWORD_2025' // Default secure password for OTP users
                });

                if (error && error.message.includes('Invalid login credentials')) {
                    // Sign up the user behind the scenes
                    const { data, error: signupError } = await supabase.auth.signUp({
                        email: mockEmail,
                        password: 'MOCK_MOBILE_PASSWORD_2025',
                        options: { data: { full_name: name || 'Mobile User' } }
                    });
                    
                    if (signupError) throw signupError;
                    
                    if (data.user) {
                        await saveProfile(data.user.id, {
                            name: name || 'Mobile User',
                            email: mockEmail,
                            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1e40af&color=fff&size=200`,
                            mobileNo: mobile
                        });
                    }
                } else if (error) {
                    throw error;
                }
                
                onAuthSuccess();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Error verifying OTP');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'SIGNUP' && authMethod === 'MOBILE') {
            return handleSendOTP();
        }
        
        if (mode === 'LOGIN' && authMethod === 'MOBILE' && !password) {
            // Login with OTP option
            return handleSendOTP();
        }

        if (mode === 'OTP_VERIFY') {
            return handleVerifyOTP();
        }

        if (!validate()) return;
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const authEmail = generateMockAuthEmail();

            if (mode === 'LOGIN') {
                const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
                if (error) throw error;
                onAuthSuccess();
            } else if (mode === 'SIGNUP') {
                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    options: { data: { full_name: name } },
                });
                if (error) throw error;
                
                if (data.user) {
                    await saveProfile(data.user.id, {
                        name,
                        email: authEmail,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e40af&color=fff&size=200`,
                        mobileNo: authMethod === 'MOBILE' ? mobile : undefined
                    });
                }
                
                if (data.session) {
                    onAuthSuccess();
                } else {
                    setSuccessMsg('Account created successfully. You can now login.');
                    clearState('LOGIN');
                }
            } else if (mode === 'FORGOT') {
                if (authMethod === 'EMAIL') {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin,
                    });
                    if (error) throw error;
                    setSuccessMsg('Password reset link sent! Check your inbox.');
                } else {
                    // Mobile mock forgot password -> Send OTP
                    handleSendOTP();
                }
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
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500 rounded-full blur-[150px] opacity-5" />
            </div>

            <div className="relative z-10 w-full max-w-md">
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
                </div>

                <div className="rounded-2xl p-8 shadow-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
                >
                    {/* Google redirect in-progress banner */}
                    {googleLoading && (
                        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 border border-blue-500/30 bg-blue-500/10">
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                            <div>
                                <p className="text-blue-300 text-sm font-semibold">Redirecting to Google…</p>
                                <p className="text-blue-400/70 text-xs">You'll be brought back automatically after sign-in.</p>
                            </div>
                        </div>
                    )}
                    {mode !== 'OTP_VERIFY' && (
                        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/5">
                            {(['MOBILE', 'EMAIL'] as AuthMethod[]).map(m => (
                                <button key={m} onClick={() => { setAuthMethod(m); setErrors({}); setErrorMsg(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${authMethod === m
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {m === 'MOBILE' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                                    {m === 'MOBILE' ? 'Mobile' : 'Email'}
                                </button>
                            ))}
                        </div>
                    )}

                    {mode !== 'FORGOT' && mode !== 'OTP_VERIFY' && (
                        <div className="flex bg-white/5 rounded-xl p-1 mb-8 border border-white/5">
                            {(['LOGIN', 'SIGNUP'] as AuthMode[]).map(m => (
                                <button key={m} onClick={() => clearState(m)}
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

                    {(mode === 'FORGOT' || mode === 'OTP_VERIFY') && (
                        <button onClick={() => clearState('LOGIN')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
                            <RotateCcw className="w-4 h-4" /> Back to Sign In
                        </button>
                    )}

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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'OTP_VERIFY' ? (
                            <>
                                <InputField
                                    id="otp" label="Enter OTP" type="text" value={otp}
                                    onChange={setOtp} placeholder="e.g. 123456"
                                    icon={Lock} error={errors.otp}
                                />
                                <p className="text-xs text-yellow-400">Mock OTP sent to console and shown in green banner.</p>
                            </>
                        ) : (
                            <>
                                {mode === 'SIGNUP' && (
                                    <InputField
                                        id="name" label="Full Name" value={name}
                                        onChange={setName} placeholder="e.g. Virat Kohli"
                                        icon={User} error={errors.name}
                                    />
                                )}

                                {authMethod === 'EMAIL' ? (
                                    <InputField
                                        id="email" label="Email Address" type="email" value={email}
                                        onChange={setEmail} placeholder="you@example.com"
                                        icon={Mail} error={errors.email}
                                    />
                                ) : (
                                    <InputField
                                        id="mobile" label="Mobile Number" type="tel" value={mobile}
                                        onChange={setMobile} placeholder="10-digit mobile number"
                                        icon={Phone} error={errors.mobile}
                                    />
                                )}

                                {(mode === 'LOGIN' && authMethod === 'EMAIL') || (mode === 'SIGNUP' && authMethod === 'EMAIL') ? (
                                    <InputField
                                        id="password" label="Password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password} onChange={setPassword}
                                        placeholder="••••••••"
                                        icon={Lock} error={errors.password}
                                        rightElement={
                                            <button type="button" onClick={() => setShowPassword(p => !p)} className="text-slate-400 hover:text-white transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                ) : null}

                                {(mode === 'LOGIN' && authMethod === 'MOBILE') && (
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-slate-400">You will receive an OTP to verify your number.</p>
                                    </div>
                                )}

                                {mode === 'SIGNUP' && authMethod === 'EMAIL' && (
                                    <InputField
                                        id="confirmPassword" label="Confirm Password"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword} onChange={setConfirmPassword}
                                        placeholder="••••••••"
                                        icon={Lock} error={errors.confirmPassword}
                                        rightElement={
                                            <button type="button" onClick={() => setShowConfirm(p => !p)} className="text-slate-400 hover:text-white transition-colors">
                                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                )}

                                {mode === 'LOGIN' && (
                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => clearState('FORGOT')} className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors">
                                            Forgot password?
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            type="submit" disabled={loading}
                            className="w-full py-3.5 mt-2 rounded-xl font-bold text-slate-900 flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                            style={{ background: loading ? '#ca8a04' : 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)', boxShadow: '0 4px 24px rgba(250,204,21,0.25)' }}
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Please wait...</>
                            ) : (
                                <>
                                    {mode === 'OTP_VERIFY' && 'Verify & Continue'}
                                    {mode === 'LOGIN' && authMethod === 'MOBILE' && 'Send OTP'}
                                    {mode === 'LOGIN' && authMethod === 'EMAIL' && 'Sign In'}
                                    {mode === 'SIGNUP' && authMethod === 'MOBILE' && 'Send OTP'}
                                    {mode === 'SIGNUP' && authMethod === 'EMAIL' && 'Create Account'}
                                    {mode === 'FORGOT' && 'Send Reset Link'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* ─── Divider ─────────────────────────────────────────── */}
                    {mode !== 'OTP_VERIFY' && mode !== 'FORGOT' && (
                        <div className="my-5 flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-slate-400 font-medium shrink-0">or continue with</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                    )}

                    {/* ─── Google Button ───────────────────────────────────── */}
                    {mode !== 'OTP_VERIFY' && mode !== 'FORGOT' && (
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || loading}
                            className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border border-white/20 bg-white/8 hover:bg-white/15 hover:border-white/30 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] shadow-lg group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {googleLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-300 shrink-0" />
                                ) : (
                                    <div className="shrink-0">
                                        <GoogleIcon />
                                    </div>
                                )}
                                <span className="font-semibold text-sm truncate">
                                    {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                                </span>
                            </div>
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                                ⚡ Recommended
                            </span>
                        </button>
                    )}

                    {mode !== 'OTP_VERIFY' && (
                        <div className="mt-6 text-center">
                            <p className="text-slate-500 text-sm">
                                {mode === 'LOGIN' ? "Don't have an account? " : 'Already have an account? '}
                                <button onClick={() => clearState(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                                    {mode === 'LOGIN' ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2025 ARcricinfo · Professional Cricket Platform
                </p>
            </div>
        </div>
    );
};
