import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Google, ClipboardCopy } from './Icons';
import { GOOGLE_CLIENT_ID } from '../config';

const Login: React.FC = () => {
    const { login, isGoogleIdentityLoaded, showToast } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (!isGoogleIdentityLoaded || !googleButtonRef.current || showHelp) {
            return;
        }

        // Prevent re-rendering the button if it's already there.
        if (googleButtonRef.current.childElementCount > 0) {
            return;
        }
        
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
             console.error("CRITICAL: Google Client ID is not configured. Please update the placeholder value in 'config.ts'.");
             if (googleButtonRef.current) {
                 googleButtonRef.current.innerHTML = '<div class="text-center p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg"><p class="font-bold">Configuration Error</p><p class="text-sm">Google Sign-In is disabled. The developer must configure a valid Google Client ID in the `config.ts` file.</p></div>';
             }
             return;
        }

        try {
            window.google.accounts.id.renderButton(
                googleButtonRef.current,
                { theme: "outline", size: "large", type: "standard", text: "signin_with", logo_alignment: "left" }
            );
        } catch (error) {
            console.error("Error rendering Google Sign-In button", error);
        }

    }, [isGoogleIdentityLoaded, login, showHelp]);

    const handleCopyOrigin = () => {
        const origin = window.location.origin;
        navigator.clipboard.writeText(origin).then(() => {
            showToast("Origin URL copied to clipboard!");
        }, (err) => {
            console.error('Could not copy text: ', err);
            showToast("Failed to copy URL.");
        });
    };
    
    const renderHelpSection = () => (
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 border border-yellow-400 dark:border-yellow-600 rounded-lg shadow-xl p-6 mt-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Troubleshooting `origin_mismatch`</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                This development environment uses a temporary, dynamic URL. For Google Sign-In to work, you must add this exact URL to your Google Cloud Console project.
            </p>
            <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">1. Copy your app's current URL:</p>
                <div className="flex items-center gap-2 mt-1">
                    <input
                        type="text"
                        readOnly
                        value={window.location.origin}
                        className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm"
                    />
                    <button onClick={handleCopyOrigin} title="Copy to clipboard" className="p-2 bg-brand-primary-100 dark:bg-brand-primary-900/50 text-brand-primary-600 dark:text-brand-primary-300 rounded-md hover:bg-brand-primary-200 dark:hover:bg-brand-primary-800/50 transition">
                        <ClipboardCopy className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">2. Add it to your Google Credentials:</p>
                <ul className="text-sm list-decimal list-inside pl-2 mt-1 text-slate-600 dark:text-slate-400 space-y-1">
                    <li>Click the link below to open the Google Cloud Console.</li>
                    <li>Find and edit your "OAuth 2.0 Client ID".</li>
                    <li>Under "Authorized JavaScript origins", click "+ ADD URI".</li>
                    <li>Paste the URL you just copied.</li>
                    <li>Click "Save", wait a minute, then try signing in again.</li>
                </ul>
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block w-full text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition">
                    Open Google Cloud Console
                </a>
            </div>
             <button onClick={() => setShowHelp(false)} className="text-sm text-slate-500 hover:underline mt-4 w-full text-center">
                Close Help
            </button>
        </div>
    );

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <div className="text-center">
                <span className="text-6xl">🏨</span>
                <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary-600 dark:text-brand-primary-400 mt-4">
                    Hotel Brendle Orchestrator
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
                    Your AI-Powered Hotel Management Dashboard. Sign in to continue.
                </p>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center min-h-[70px]">
                {showHelp ? renderHelpSection() : (
                    <>
                        <div ref={googleButtonRef} className="min-h-[50px]">
                            {!isGoogleIdentityLoaded && (
                                <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-3 px-8 rounded-full shadow-md border border-slate-200 dark:border-slate-700 animate-pulse">
                                    <Google className="w-6 h-6" />
                                    <span>Loading Sign-In...</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowHelp(true)} className="text-sm text-slate-500 hover:underline mt-4">
                            Having trouble signing in?
                        </button>
                    </>
                )}
            </div>
            
            {!showHelp && (
                 <div className="absolute bottom-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    <p>&copy; 2025 Hotel Brendle Renovation Project.</p>
                </div>
            )}
        </div>
    );
};

export default Login;