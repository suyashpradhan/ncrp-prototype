export type ExperienceMode = "DEMO_CASE" | "LIVE_TEST";

export type ProfileSource = "SIMULATED_NCRP_PROFILE" | "TEST_INPUT";

export type ReporterProfile = {
  displayName: string;
  state: string;
  registeredMobile: string;
  source: ProfileSource;
};

export const SYNTHETIC_NCRP_PROFILE: ReporterProfile = {
  displayName: "Asha Verma",
  state: "Karnataka",
  registeredMobile: "••••••0024",
  source: "SIMULATED_NCRP_PROFILE",
};

export function createEmptyTestProfile(): ReporterProfile {
  return {
    displayName: "",
    state: "",
    registeredMobile: "",
    source: "TEST_INPUT",
  };
}
