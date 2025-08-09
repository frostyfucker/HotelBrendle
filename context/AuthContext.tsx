import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { hotelData, initialTasks, initialInventory } from '../data/hotelData';
import { GOOGLE_CLIENT_ID, ADMIN_EMAILS, STAFF_EMAILS } from '../config';

// Augment the Window interface to include gapi and google
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface ToastMessage {
    id: number;
    message: string;
}

interface AuthContextType {
    user: User | null;
    login: (response: any) => void;
    logout: () => void;
    saveToDrive: (fileName: string, content: string, mimeType: string) => Promise<void>;
    showToast: (message: string) => void;
    toast: ToastMessage | null;
    isGoogleIdentityLoaded: boolean;
    isDriveApiReady: boolean;
}

function determineRole(email: string): UserRole {
  if (!email) return 'guest';
  const lowerCaseEmail = email.toLowerCase();
  if (ADMIN_EMAILS.includes(lowerCaseEmail)) return 'admin';
  if (STAFF_EMAILS.includes(lowerCaseEmail)) return 'staff';
  return 'guest';
}

function decodeJwt(token: string) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        return null;
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to load scripts programmatically and handle errors
const loadScript = (src: string, onLoad: () => void, onError: () => void) => {
    // Avoid loading the same script multiple times, which can happen with React's fast refresh
    if (document.querySelector(`script[src="${src}"]`)) {
        onLoad();
        return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.body.appendChild(script);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isGoogleIdentityLoaded, setIsGoogleIdentityLoaded] = useState(false);
    const [isDriveApiReady, setIsDriveApiReady] = useState(false);
    const [googleTokenClient, setGoogleTokenClient] = useState<any>(null);

    const showToast = (message: string) => {
        const id = Date.now();
        setToast({ id, message });
        setTimeout(() => setToast(current => (current?.id === id ? null : current)), 3000);
    };

    useEffect(() => {
        const handleScriptError = (scriptName: string) => {
            console.error(`Failed to load ${scriptName} script.`);
            showToast(`Error: Could not load Google services. Please refresh.`);
            setIsGoogleIdentityLoaded(true); // Unblock UI from a perpetual loading state
        };

        // Load Google Sign-In (GSI) script first
        loadScript(
            'https://accounts.google.com/gsi/client',
            () => { // GSI onLoad callback
                if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
                    console.error("Google Client ID not configured in config.ts. Authentication will not work.");
                    setIsGoogleIdentityLoaded(true);
                    return;
                }

                // Initialize GSI client
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: login,
                    cancel_on_tap_outside: true,
                });
                setIsGoogleIdentityLoaded(true);
                
                // After GSI is ready, load the Google API (GAPI) script for Drive
                loadScript(
                    'https://apis.google.com/js/api.js', 
                    () => window.gapi.load('client', initializeGapiClient),
                    () => handleScriptError('Google API (GAPI)')
                );
            },
            () => handleScriptError('Google Sign-In (GSI)') // GSI onError callback
        );

        // Check for saved user session on initial load
        try {
            const savedUserJson = sessionStorage.getItem('hotelBrendleUser');
            if (savedUserJson) {
                const savedUser = JSON.parse(savedUserJson);
                setUser(savedUser);
            }
        } catch (error) {
            console.error("Failed to parse user from sessionStorage", error);
            sessionStorage.removeItem('hotelBrendleUser');
        }
    }, []);

    const initializeGapiClient = async () => {
        await window.gapi.client.init({});
        
        if (window.google?.accounts?.oauth2) {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: '', // This will be set dynamically before use
            });
            setGoogleTokenClient(tokenClient);
        }
        setIsDriveApiReady(true);
    };

    const seedUserData = (userId: string) => {
        const dataKeys = {
            'hotelBrendleData': hotelData,
            'hotelBrendleTasks': initialTasks,
            'hotelBrendleDirective': 'Focus on preparing guest-facing areas and completing all pending low-cost maintenance tasks.',
            'hotelBrendleInventory': initialInventory,
            'renovationTotalBudget': 250000,
            'renovationExpenses': [
                { id: 'exp-1', title: 'Initial site survey and planning', date: '2024-05-01', amount: 2500, category: 'Other' },
                { id: 'exp-2', title: 'Lobby demolition labor', date: '2024-05-10', amount: 7500, category: 'Labor' },
                { id: 'exp-3', title: 'Structural steel beams', date: '2024-05-15', amount: 12500, category: 'Materials' },
            ],
            'hotelBrendleOrderRequests': [],
            'timeClockStatus': 'out',
            'timeClockTime': null,
        };

        for (const [key, value] of Object.entries(dataKeys)) {
            const userKey = `${userId}-${key}`;
            if (localStorage.getItem(userKey) === null) {
                localStorage.setItem(userKey, JSON.stringify(value));
            }
        }
    };

    const login = (response: any) => {
        const decoded: { name: string; email: string; picture: string, sub: string } = decodeJwt(response.credential);
        if (!decoded) {
            showToast("Login failed. Could not verify identity.");
            return;
        }

        const role = determineRole(decoded.email);
        const loggedInUser: User = {
            id: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            role: role,
            avatarUrl: decoded.picture
        };
        
        setUser(loggedInUser);
        sessionStorage.setItem('hotelBrendleUser', JSON.stringify(loggedInUser));
        seedUserData(loggedInUser.id);
        showToast(`Welcome, ${loggedInUser.name}!`);
    };

    const logout = () => {
        if (user) {
            window.google?.accounts.id.revoke(user.email, () => {
                console.log('Google token revoked');
            });
        }
        setUser(null);
        sessionStorage.removeItem('hotelBrendleUser');
        showToast('You have been logged out.');
    };

    const saveToDrive = async (fileName: string, content: string, mimeType: string) => {
        if (!isDriveApiReady || !googleTokenClient) {
            showToast("Google Drive is not ready yet. Please try again in a moment.");
            return;
        }

        googleTokenClient.callback = async (tokenResponse: any) => {
            if (tokenResponse.error) {
                console.error(tokenResponse.error);
                showToast("Google Drive access denied.");
                return;
            }

            window.gapi.client.setToken(tokenResponse);

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const metadata = { 'name': fileName, 'mimeType': mimeType };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + mimeType + '\r\n\r\n' +
                content +
                close_delim;

            try {
                const request = await window.gapi.client.request({
                    'path': '/upload/drive/v3/files',
                    'method': 'POST',
                    'params': {'uploadType': 'multipart'},
                    'headers': { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                    'body': multipartRequestBody
                });

                if (request.status === 200) {
                    showToast(`File "${fileName}" saved to Google Drive!`);
                } else {
                    showToast(`Error saving to Drive: ${request.result.error.message}`);
                }
            } catch (error: any) {
                console.error(error);
                showToast(`An error occurred while saving: ${error.message}`);
            } finally {
                window.gapi.client.setToken(null);
            }
        };

        if (window.gapi.client.getToken() === null) {
            googleTokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            googleTokenClient.requestAccessToken({prompt: 'none'});
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, saveToDrive, showToast, toast, isGoogleIdentityLoaded, isDriveApiReady }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};