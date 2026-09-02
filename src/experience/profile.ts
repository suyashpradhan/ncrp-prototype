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
    title: "",
    displayName: "",
    registeredMobile: "",
    gender: "",
    dateOfBirth: "",
    parentOrSpouseRelationship: "",
    parentOrSpouseName: "",
    email: "",
    relationshipWithVictim: "",
    houseNumber: "",
    street: "",
    colony: "",
    city: "",
    tehsil: "",
    country: "",
    state: "",
    district: "",
    policeStation: "",
    pinCode: "",
    source: "TEST_INPUT",
  };
}
