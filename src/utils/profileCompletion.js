export const calculateProfileCompletion = (form = {}, files = {}) => {
  const hasValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const hasValidClinicBasic = Array.isArray(form.clinics)
    && form.clinics.some(
      (clinic) =>
        hasValue(clinic?.clinicName) &&
        hasValue(clinic?.clinicAddress) &&
        hasValue(clinic?.consultationFee)
    );

  const hasValidClinicAvailability = Array.isArray(form.clinics)
    && form.clinics.some(
      (clinic) =>
        Array.isArray(clinic?.availability) &&
        clinic.availability.some(
          (slot) =>
            hasValue(slot?.day) &&
            hasValue(slot?.startTime) &&
            hasValue(slot?.endTime)
        )
    );

  const hasValidVisitingBasic = Array.isArray(form.visitingPositions)
    && form.visitingPositions.some(
      (vp) =>
        hasValue(vp?.location) &&
        hasValue(vp?.fees)
    );

  const hasValidVisitingAvailability = Array.isArray(form.visitingPositions)
    && form.visitingPositions.some(
      (vp) =>
        Array.isArray(vp?.availability) &&
        vp.availability.some(
          (slot) =>
            hasValue(slot?.day) &&
            hasValue(slot?.startTime) &&
            hasValue(slot?.endTime)
        )
    );

  const hasGovtId =
    Array.isArray(files?.govtIds) &&
    files.govtIds.some((id) => hasValue(id?.type) && hasValue(id?.file));

  const hasCertificate =
    Array.isArray(files?.certificates) &&
    files.certificates.some((cert) => hasValue(cert?.title) && hasValue(cert?.file));

  const hasProfileImage = hasValue(form.profilePic) || hasValue(form.profilePictureUrl);

  let score = 0;

  // BASIC INFO = 30
  if (hasValue(form.fullName)) score += 5;
  if (hasValue(form.email)) score += 5;
  if (hasValue(form.mobile)) score += 5;
  if (hasValue(form.gender)) score += 5;
  if (hasValue(form.bio)) score += 5;
  if (hasProfileImage) score += 5;

  // PROFESSIONAL INFO = 30
  if (Array.isArray(form.specializations) && form.specializations.length > 0) score += 7;
  if (Array.isArray(form.degrees) && form.degrees.length > 0) score += 7;
  if (hasValue(form.experienceYears)) score += 6;
  if (hasValue(form.councilName)) score += 4;
  if (hasValue(form.registrationNumber)) score += 3;
  if (hasValue(form.registrationYear)) score += 3;

  // PRACTICE INFO = 20
  if (hasValidClinicBasic) score += 8;
  if (hasValidClinicAvailability) score += 6;
  if (hasValidVisitingBasic) score += 3;
  if (hasValidVisitingAvailability) score += 3;

  // DOCUMENTS = 20
  if (hasValue(files?.signature)) score += 6;
  if (hasGovtId) score += 7;
  if (hasCertificate) score += 7;

  if (score > 100) return 100;
  if (score < 0) return 0;
  return score;
};