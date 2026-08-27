export type ExperienceMode = "DEMO_CASE" | "LIVE_TEST";

export type ProfileSource = "SIMULATED_NCRP_PROFILE" | "TEST_INPUT";

export type ReporterProfile = {
  title: string;
  displayName: string;
  registeredMobile: string;
  gender: string;
  dateOfBirth: string;
  parentOrSpouseRelationship: string;
  parentOrSpouseName: string;
  email: string;
  relationshipWithVictim: string;
  houseNumber: string;
  street: string;
  colony: string;
  city: string;
  tehsil: string;
  country: string;
  state: string;
  district: string;
  policeStation: string;
  pinCode: string;
  source: ProfileSource;
};

export const SYNTHETIC_NCRP_PROFILE: ReporterProfile = {
  title: "Ms",
  displayName: "Asha Verma",
  registeredMobile: "••••••0024",
  gender: "Female",
  dateOfBirth: "1992-04-18",
  parentOrSpouseRelationship: "Father",
  parentOrSpouseName: "Synthetic Parent",
  email: "asha.demo@example.invalid",
  relationshipWithVictim: "Self",
  houseNumber: "Demo 24",
  street: "Synthetic Service Road",
  colony: "Prototype Layout",
  city: "Bengaluru",
  tehsil: "Synthetic Tehsil",
  country: "India",
  state: "Karnataka",
  district: "Bengaluru Urban",
  policeStation: "Synthetic jurisdiction",
  pinCode: "TEST-560000",
  source: "SIMULATED_NCRP_PROFILE",
};

export function createEmptyTestProfile(): ReporterProfile {
  return {
    title: "Mx",
    displayName: "",
    registeredMobile: "••••••0000",
    gender: "Not specified in test",
    dateOfBirth: "1990-01-01",
    parentOrSpouseRelationship: "Test relationship",
    parentOrSpouseName: "Synthetic Test Parent",
    email: "reporter.demo@example.invalid",
    relationshipWithVictim: "Self",
    houseNumber: "Test house",
    street: "Synthetic test street",
    colony: "Prototype locality",
    city: "Test city",
    tehsil: "Synthetic tehsil",
    country: "India",
    state: "Test state",
    district: "Synthetic district",
    policeStation: "Synthetic jurisdiction",
    pinCode: "TEST-000000",
    source: "TEST_INPUT",
  };
}
