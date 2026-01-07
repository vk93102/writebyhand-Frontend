import Constants from 'expo-constants';

interface GoogleAuthExtra {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  expoClientId?: string;
  redirectPath?: string;
  scheme?: string | string[];
}

const sanitizeScheme = (input?: string | string[]): string | undefined => {
  if (Array.isArray(input)) {
    return input[0];
  }
  return input;
};

const resolveExtra = (): GoogleAuthExtra => {
  const expoExtra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const manifestExtra = (Constants.manifest as any)?.extra as Record<string, unknown> | undefined;
  const googleExtra = (expoExtra?.googleAuth || manifestExtra?.googleAuth || {}) as GoogleAuthExtra;
  return googleExtra;
};

// Also allow falling back to environment variables (useful for web/local dev where
// developers keep secrets in a .env file and start the dev server with them).
const resolveFromEnv = () => {
  const env = (process && (process.env as Record<string, string | undefined>)) || {};
  return {
    webClientId:
      env.WEB_CLIENT_ID || env.REACT_APP_WEB_CLIENT_ID || env.EXPO_WEB_CLIENT_ID || env.GOOGLE_WEB_CLIENT_ID || env.REACT_APP_GOOGLE_CLIENT_ID || env.GOOGLE_OAUTH_CLIENT_ID || '',
    iosClientId: env.IOS_CLIENT_ID || env.REACT_APP_IOS_CLIENT_ID || env.GOOGLE_IOS_CLIENT_ID || '',
    androidClientId: env.ANDROID_CLIENT_ID || env.REACT_APP_ANDROID_CLIENT_ID || env.GOOGLE_ANDROID_CLIENT_ID || '',
    expoClientId: env.EXPO_CLIENT_ID || env.REACT_APP_EXPO_CLIENT_ID || env.EXPO_GOOGLE_CLIENT_ID || '',
    redirectPath: env.GOOGLE_OAUTH_REDIRECT_PATH || undefined,
    scheme: env.EXPO_SCHEME || undefined,
  };
};

const googleExtra = resolveExtra();
const envExtra = resolveFromEnv();

const resolvedScheme: string =
  sanitizeScheme(googleExtra.scheme) || sanitizeScheme(envExtra.scheme) || sanitizeScheme(Constants.expoConfig?.scheme) || 'edtechsolver';

export const googleAuthConfig: {
  scheme: string;
  redirectPath: string;
  webClientId: string;
  iosClientId: string;
  androidClientId: string;
  expoClientId: string;
} = {
  scheme: resolvedScheme,
  redirectPath: googleExtra.redirectPath || envExtra.redirectPath || 'auth/callback',
  webClientId: googleExtra.webClientId || envExtra.webClientId || '',
  iosClientId: googleExtra.iosClientId || envExtra.iosClientId || '',
  androidClientId: googleExtra.androidClientId || envExtra.androidClientId || '',
  expoClientId: googleExtra.expoClientId || envExtra.expoClientId || googleExtra.webClientId || envExtra.webClientId || '',
};
