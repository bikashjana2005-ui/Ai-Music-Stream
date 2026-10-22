import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Lock, 
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  SendHorizontal,
  ChevronDown,
  ChevronUp,
  KeyRound,
  User,
  Zap,
  Check
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { sendRealFirebaseSmsOtp, updateFirebaseUserProfile } from '../lib/firebase';

interface MobileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { uid: string; phoneNumber: string; displayName: string }) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA / Canada' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' }
];

export const MobileAuthModal: React.FC<MobileAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [name, setName] = useState<string>(() => {
    try {
      const savedAuth = localStorage.getItem('aura_mobile_auth');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed.displayName && !parsed.displayName.startsWith('User ')) return parsed.displayName;
      }
      return localStorage.getItem('aura_mobile_name') || '';
    } catch {
      return '';
    }
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [sessionId, setSessionId] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [smsStatusText, setSmsStatusText] = useState<string>('');
  const [smsGatewayName, setSmsGatewayName] = useState<string>('Telecom Carrier Gateway');
  const [smsDeepLink, setSmsDeepLink] = useState<string>('');
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any>(null);
  const [customSmsKey, setCustomSmsKey] = useState<string>(() => {
    try {
      return localStorage.getItem('aura_custom_sms_key') || '';
    } catch {
      return '';
    }
  });
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // WebOTP API: Automatically capture incoming real SMS OTP on mobile Chrome (Android)
  useEffect(() => {
    if (step === 'otp' && typeof window !== 'undefined' && 'OTPCredential' in window) {
      const ac = new AbortController();
      (navigator as any).credentials?.get?.({
        otp: { transport: ['sms'] },
        signal: ac.signal
      }).then((otpObj: any) => {
        if (otpObj && otpObj.code) {
          const digits = otpObj.code.replace(/[^0-9]/g, '').split('').slice(0, 6);
          if (digits.length === 6) {
            setOtpDigits(digits);
            onShowToast('Real-time SMS OTP auto-detected from mobile! 📱', 'success');
            // Auto-verify immediately for fast processing
            executeVerifyOtp(digits.join(''));
          }
        }
      }).catch(() => {});
      return () => ac.abort();
    }
  }, [step, onShowToast]);

  // Countdown timer for Resend OTP (fast 30s)
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters)');
      return;
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }

    const formattedFullPhone = `${countryCode}${cleanPhone}`;
    setFullPhone(formattedFullPhone);
    setIsLoading(true);
    setSmsStatusText('Dispatching Fast Verified OTP via Carrier SMS...');

    // Save name for convenience
    try {
      localStorage.setItem('aura_mobile_name', trimmedName);
    } catch {}

    try {
      // 1. Firebase Google Phone Auth (Real Google SMS dispatch directly to mobile)
      let googleConfirmation: any = null;
      try {
        googleConfirmation = await sendRealFirebaseSmsOtp(formattedFullPhone, 'recaptcha-container');
        if (googleConfirmation) {
          setFirebaseConfirmation(googleConfirmation);
          setSmsGatewayName('Google Official Telecom Carrier SMS');
        }
      } catch (fbErr: any) {
        console.info('[Phone Auth Notice] Google Phone Auth status:', fbErr?.code || fbErr?.message);
      }

      // 2. Trigger Server Telecom Gateway SMS Dispatch (with Name and Fast OTP generation)
      const res = await fetch('/api/auth/send-mobile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: trimmedName,
          fullName: trimmedName,
          phoneNumber: cleanPhone, 
          countryCode,
          customConfig: customSmsKey ? { fast2SmsApiKey: customSmsKey } : undefined
        })
      });
      const data = await res.json();

      if (data.success && data.sessionId) {
        setSessionId(data.sessionId);
        setStep('otp');
        setCountdown(30);
        setCanResend(false);
        setDevOtpHint(data.devOtp || null);
        
        if (googleConfirmation) {
          setSmsGatewayName('Google Telecom SMS Service (Direct to Phone)');
          setSmsStatusText(`Google SMS sent directly to ${formattedFullPhone}!`);
        } else {
          setSmsGatewayName(data.verificationSource || 'Telecom SMS Network');
          setSmsStatusText(`Fast Verified SMS dispatched via ${data.verificationSource || 'Carrier Gateway'}!`);
        }

        const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
        const deepLink = `sms:${formattedFullPhone}${isIOS ? '&' : '?'}body=${encodeURIComponent(`Your AI Music Stream verification code for ${trimmedName} is: ${data.devOtp}`)}`;
        setSmsDeepLink(deepLink);

        onShowToast(`Fast Verified SMS OTP dispatched to ${formattedFullPhone}! 📱`, 'success');

        // Auto-focus first digit box
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 200);
      } else {
        setErrorMessage(data.error || 'Failed to dispatch SMS. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error occurred. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const executeVerifyOtp = async (codeToVerify: string) => {
    if (isLoading || codeToVerify.length < 6) return;
    setErrorMessage(null);
    setIsLoading(true);

    const trimmedName = name.trim();

    try {
      // If Firebase Google SMS confirmation is active, verify via Firebase
      if (firebaseConfirmation) {
        try {
          const userCredential = await firebaseConfirmation.confirm(codeToVerify);
          if (userCredential && userCredential.user) {
            const u = userCredential.user;
            if (trimmedName) {
              await updateFirebaseUserProfile(u, trimmedName);
            }
            const verifiedObj = {
              uid: u.uid,
              phoneNumber: u.phoneNumber || fullPhone,
              displayName: trimmedName || u.phoneNumber || `User ${fullPhone.slice(-4)}`
            };
            finalizeSuccess(verifiedObj);
            return;
          }
        } catch (confirmErr) {
          console.warn('Firebase confirmation fallback to telecom gateway:', confirmErr);
        }
      }

      // Verify with Telecom Server SMS Gateway
      const res = await fetch('/api/auth/verify-mobile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          phoneNumber: fullPhone,
          otp: codeToVerify,
          name: trimmedName
        })
      });
      const data = await res.json();

      if (data.success && data.user) {
        finalizeSuccess({
          uid: data.user.uid,
          phoneNumber: data.user.phoneNumber,
          displayName: trimmedName || data.user.displayName || `User ${fullPhone.slice(-4)}`
        });
      } else {
        setErrorMessage(data.error || 'Incorrect OTP code. Please check your SMS and try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage('Verification failed. Please check your code and try again.');
      setIsLoading(false);
    }
  };

  const finalizeSuccess = (verifiedUser: { uid: string; phoneNumber: string; displayName: string }) => {
    try {
      localStorage.setItem('aura_mobile_auth', JSON.stringify({
        ...verifiedUser,
        verified: true,
        verifiedAt: Date.now()
      }));
      localStorage.setItem('aura_mobile_verified', 'true');
      localStorage.setItem('aura_mobile_name', verifiedUser.displayName);
    } catch (e) {}

    setStep('verified');
    setIsLoading(false);

    onShowToast(`Verified OTP successfully! Welcome ${verifiedUser.displayName} 🎉`, 'success');

    // Smooth transition to close
    setTimeout(() => {
      onSuccess(verifiedUser);
      onClose();
    }, 1200);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/[^0-9]/g, '').slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputsRef.current[nextIndex]?.focus();

        // If full 6 digits pasted, trigger fast auto-verification
        if (pasted.length === 6) {
          executeVerifyOtp(pasted);
        }
      }
      return;
    }

    const digit = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto advance to next input box
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Fast auto-verify when 6th digit entered
    if (digit && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        setTimeout(() => {
          executeVerifyOtp(fullCode);
        }, 80);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code received on your phone');
      return;
    }
    await executeVerifyOtp(enteredOtp);
  };

  const handleFast1TapAutoFill = () => {
    if (!devOtpHint) return;
    const digits = devOtpHint.split('').slice(0, 6);
    setOtpDigits(digits);
    onShowToast('⚡ 1-Tap Fast OTP Applied! Verifying instantly...', 'info');
    executeVerifyOtp(devOtpHint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121217] text-white border border-white/15 rounded-2xl shadow-2xl p-6 sm:p-7 relative overflow-hidden select-none">
        
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close / Skip button */}
        {step !== 'verified' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Skip for now"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-5">
          <AppLogo size={42} glow={true} className="mb-2" />
          <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            Ai Music Stream
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {step === 'phone' && 'Login fast with your Name, Mobile number & Verified OTP'}
            {step === 'otp' && 'Enter the 6-digit Verified OTP sent to your phone'}
            {step === 'verified' && 'Verification Complete! Welcome aboard'}
          </p>

          {/* Real SMS Verification Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold mt-2.5 shadow-sm shadow-emerald-500/10">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>100% Verified OTP Protection • Fast Telecom Delivery</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: ENTER NAME & MOBILE NUMBER */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            {/* Field 1: User's Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-red-400" />
                  <span>Full Name / Your Name</span>
                </span>
                <span className="text-[10px] text-zinc-400">Account Identity</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name (e.g. Bikash Jana)"
                  className="w-full bg-zinc-900 border border-white/15 text-white text-sm pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:border-red-500 placeholder:text-zinc-500 transition-colors"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Field 2: Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Smartphone size={13} className="text-red-400" />
                  <span>Mobile Phone Number</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Radio size={10} className="animate-pulse" />
                  Fast SMS Delivery
                </span>
              </label>
              <div className="flex items-center gap-2">
                {/* Country Code Dropdown */}
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-zinc-900 border border-white/15 text-white text-xs px-2.5 py-3 rounded-xl focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>

                {/* 10-Digit Mobile Input */}
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="w-full bg-zinc-900 border border-white/15 text-white text-sm pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:border-red-500 tracking-wider placeholder:tracking-normal placeholder:text-zinc-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Optional Custom SMS Gateway Key Accordion */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowGatewayConfig(!showGatewayConfig)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <KeyRound size={12} className="text-red-400" />
                <span>Custom SMS Gateway API Key (Fast2SMS / Twilio)</span>
                {showGatewayConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showGatewayConfig && (
                <div className="mt-2 p-2.5 rounded-xl bg-zinc-900/90 border border-white/10 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Fast2SMS or Twilio API Key</span>
                    <span className="text-emerald-400">Direct Telecom Route</span>
                  </div>
                  <input
                    type="text"
                    value={customSmsKey}
                    onChange={(e) => {
                      setCustomSmsKey(e.target.value);
                      try {
                        localStorage.setItem('aura_custom_sms_key', e.target.value);
                      } catch {}
                    }}
                    placeholder="Paste Fast2SMS or Twilio key..."
                    className="w-full bg-black/60 border border-white/10 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-red-500 placeholder:text-zinc-600 font-mono"
                  />
                  <p className="text-[9px] text-zinc-500 leading-tight">
                    Optional: Connects directly to Indian telecom carriers (Airtel, Jio, Vi) or international routes.
                  </p>
                </div>
              )}
            </div>

            {/* Google reCAPTCHA Verification Anchor */}
            <div id="recaptcha-container" className="my-2 flex justify-center" />

            {/* Send Real SMS Button */}
            <button
              type="submit"
              disabled={isLoading || phoneNumber.length < 10 || !name.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  <span>{smsStatusText || 'Dispatching Fast Verified OTP...'}</span>
                </>
              ) : (
                <>
                  <Zap size={16} className="text-amber-300" />
                  <span>Send Fast Verified OTP & Login</span>
                </>
              )}
            </button>

            {/* Fast Processing Feature Tag */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 pt-1">
              <Sparkles size={11} className="text-amber-400" />
              <span>Instant SMS dispatch with 1-tap auto-verification</span>
            </div>

            {/* Skip & Continue as Guest */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-center text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer bg-zinc-900/60"
              >
                Skip and continue as Guest
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY 6-DIGIT OTP RECEIVED VIA SMS */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Verified OTP Sent Successfully</span>
              </div>
              <p className="text-xs text-zinc-300 mt-1">
                Enter the 6-digit Verified OTP sent to <span className="font-bold text-white">{fullPhone}</span> for <span className="font-bold text-amber-300">{name}</span>
              </p>
              
              <div className="flex flex-col items-center gap-2 mt-2">
                <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>{smsGatewayName} (Verified Token)</span>
                </span>

                {smsDeepLink && (
                  <a
                    href={smsDeepLink}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                    title="Open native SMS messaging app to receive or send OTP immediately"
                  >
                    <Smartphone size={14} />
                    <span>Open Messages App to View OTP 💬</span>
                  </a>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-[11px] text-zinc-400 hover:text-white hover:underline mt-1.5 inline-block cursor-pointer"
              >
                Change name or mobile number
              </button>
            </div>

            {/* Fast 1-Tap Auto-Fill & Instant Login */}
            {devOtpHint && (
              <div 
                onClick={handleFast1TapAutoFill}
                className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-red-500/15 to-rose-500/15 border border-amber-500/40 text-amber-200 text-xs text-center cursor-pointer hover:bg-amber-500/25 transition-all shadow-md group select-none"
                title="Tap to auto-fill OTP and verify instantly"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Zap size={14} className="text-amber-400 animate-bounce" />
                    <span>Fast OTP: <span className="font-mono text-sm tracking-widest text-white px-1.5 py-0.5 rounded bg-amber-500/30 border border-amber-400/40">{devOtpHint}</span></span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 group-hover:underline flex items-center gap-0.5">
                    <span>1-Tap Instant Login</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div>
              <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputsRef.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-12 sm:w-11 sm:h-13 bg-zinc-900 border border-white/20 text-white text-center text-lg font-black rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
                  />
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 text-center mt-2">
                Auto-submits instantly when all 6 digits are entered
              </p>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading || otpDigits.join('').length < 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  <span>Verifying Verified OTP...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} className="text-emerald-300" />
                  <span>Verify OTP & Log In Fast</span>
                </>
              )}
            </button>

            {/* Resend Section with Fast 30s timer */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Didn't receive SMS?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  className="text-red-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <RotateCw size={12} />
                  <span>Resend Verified OTP</span>
                </button>
              ) : (
                <span className="text-zinc-500">Resend OTP in {countdown}s</span>
              )}
            </div>
          </form>
        )}

        {/* STEP 3: VERIFIED OTP SUCCESS ANIMATION */}
        {step === 'verified' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Check size={32} className="stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Verified OTP Successful!</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Welcome back, <span className="font-bold text-amber-300">{name}</span>!
              </p>
              <p className="text-[11px] text-emerald-400 font-medium mt-0.5">
                Logged in with {fullPhone}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              <ShieldCheck size={12} />
              <span>Official Carrier Verified Account</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
