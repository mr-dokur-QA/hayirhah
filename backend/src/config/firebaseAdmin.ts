import admin from 'firebase-admin';

let initialized = false;

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  try {
    if (raw && raw.trim().length > 0) {
      return JSON.parse(raw) as admin.ServiceAccount;
    }
    if (b64 && b64.trim().length > 0) {
      const decoded = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(decoded) as admin.ServiceAccount;
    }
  } catch (e) {
    // fall through
  }
  return null;
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (initialized) {
    try {
      return admin.app();
    } catch {
      return null;
    }
  }

  initialized = true;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  // Initialize once
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.app();
}


