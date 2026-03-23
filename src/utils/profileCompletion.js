export const calculateProfileCompletion = (user) => {
  let score = 0;

  if (user.fullName) score += 10;
  if (user.email) score += 10;
  if (user.phone) score += 10;
  if (user.specialization) score += 10;
  if (user.experience) score += 10;
  if (user.gender) score += 10;
  if (user.about) score += 10;

  // ✅ IMPORTANT FIX
if (user.clinics && user.clinics.length > 0) {
  const validClinic = user.clinics.some(
    c => c.clinicName && c.clinicAddress && c.consultationFee
  );
  if (validClinic) score += 10;
}

  if (user.councilName) score += 10;
  if (user.registrationNumber) score += 10;
  if (user.registrationYear) score += 10;

  return score;
};