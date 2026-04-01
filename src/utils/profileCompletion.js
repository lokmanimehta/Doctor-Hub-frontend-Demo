export const calculateProfileCompletion = (form = {}, files = {}) => {
  let score = 0;

  // BASIC
  if (form.phone) score += 5;
  if (form.gender) score += 5;
  if (form.about) score += 5;
  if (form.profilePic) score += 5;

  // PROFESSIONAL
  if (form.specialization) score += 10;
  if (form.experience) score += 10;

  // CLINIC
  if (form.clinics?.length > 0) {
    score += 15;

    const hasValidAvailability = form.clinics.some(clinic =>
      clinic.availability?.some(
        slot => slot.day && slot.startTime && slot.endTime
      )
    );

    if (hasValidAvailability) score += 10;
  }

  // VISITING
  if (form.visitingPositions?.length > 0) score += 5;

  // VERIFICATION
  if (form.councilName) score += 10;
  if (form.registrationNumber && form.registrationYear) score += 10;

  // DOCUMENTS (FIXED)
  if (files?.signature) score += 5;

  const hasGovtId = files?.govtIds?.some(id => id.file);
  if (hasGovtId) score += 5;

  const hasCertificate = files?.certificates?.some(c => c.file);
  if (hasCertificate) score += 5;

  // 🔥 FINAL FIX
  return Math.min(score, 100);
};