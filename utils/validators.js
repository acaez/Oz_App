const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email requis.';
  if (!EMAIL_RE.test(email.trim()))         return 'Adresse e-mail invalide.';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Mot de passe requis.';
  if (password.length < 8)                        return 'Mot de passe trop court (8 car. min).';
  if (!/[A-Z]/.test(password))                    return 'Au moins 1 majuscule requise.';
  if (!/[0-9]/.test(password))                    return 'Au moins 1 chiffre requis.';
  if (!/[^A-Za-z0-9]/.test(password))             return 'Au moins 1 caractère spécial requis.';
  return null;
}

function validateDob(dob) {
  if (!dob) return 'Date de naissance requise.';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 'Date invalide.';
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  if (birth > limit) return 'Vous devez avoir au moins 18 ans.';
  return null;
}

module.exports = { validateEmail, validatePassword, validateDob };
