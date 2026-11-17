const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { defineString } = require('firebase-functions/params');
const { HttpsError, onCall } = require('firebase-functions/v2/https');

initializeApp();

const bootstrapAdminEmail = defineString('BOOTSTRAP_ADMIN_EMAIL');

async function getAdministrator(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before managing administrator access.');
  }

  const user = await getAuth().getUser(request.auth.uid);
  if (user.customClaims?.admin !== true) {
    throw new HttpsError('permission-denied', 'Administrator access is required.');
  }

  return user;
}

exports.bootstrapAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before activating administrator access.');
  }

  const user = await getAuth().getUser(request.auth.uid);
  const configuredEmail = bootstrapAdminEmail.value().trim().toLowerCase();
  const signedInEmail = user.email?.trim().toLowerCase();

  if (!configuredEmail || signedInEmail !== configuredEmail || user.emailVerified !== true) {
    throw new HttpsError(
      'permission-denied',
      'Only the configured, verified bootstrap administrator can activate access.',
    );
  }

  const bootstrapRef = getFirestore().doc('_metadata/adminBootstrap');
  await getFirestore().runTransaction(async (transaction) => {
    const marker = await transaction.get(bootstrapRef);
    if (marker.exists && marker.data().adminUid !== user.uid) {
      throw new HttpsError('failed-precondition', 'The initial administrator has already been activated.');
    }
    transaction.set(bootstrapRef, {
      adminUid: user.uid,
      activatedAt: FieldValue.serverTimestamp(),
    });
  });

  await getAuth().setCustomUserClaims(user.uid, {
    ...user.customClaims,
    admin: true,
  });

  return { administratorEnabled: true };
});

exports.setAdminAccess = onCall(async (request) => {
  await getAdministrator(request);

  const email = typeof request.data?.email === 'string' ? request.data.email.trim() : '';
  const enabled = request.data?.enabled;

  if (!email || typeof enabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'A valid email and enabled flag are required.');
  }

  let target;
  try {
    target = await getAuth().getUserByEmail(email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', 'No Firebase Authentication user exists for that email.');
    }
    throw error;
  }

  if (enabled && target.emailVerified !== true) {
    throw new HttpsError('failed-precondition', 'Verify the target email before granting administrator access.');
  }

  await getAuth().setCustomUserClaims(target.uid, {
    ...target.customClaims,
    admin: enabled,
  });

  return { email: target.email, administratorEnabled: enabled };
});
