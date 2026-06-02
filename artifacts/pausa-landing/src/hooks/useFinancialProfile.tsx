import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface FinancialProfile {
  name: string;
  age: number | null;
  occupation: string;
  monthlyIncome: number | null;
  monthlyExpenses: number | null;
  goals: string[];
  riskTolerance: "low" | "medium" | "high";
  profileComplete: boolean;
}

const DEFAULT_PROFILE: FinancialProfile = {
  name: "",
  age: null,
  occupation: "",
  monthlyIncome: null,
  monthlyExpenses: null,
  goals: [],
  riskTolerance: "medium",
  profileComplete: false,
};

interface ProfileContextValue {
  profile: FinancialProfile;
  updateProfile: (patch: Partial<FinancialProfile>) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  resetProfile: () => {},
});

const STORAGE_KEY = "finadvisor_profile_v1";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FinancialProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const updateProfile = (patch: Partial<FinancialProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      next.profileComplete = !!(next.monthlyIncome && next.monthlyExpenses);
      return next;
    });
  };

  const resetProfile = () => setProfile(DEFAULT_PROFILE);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, resetProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useFinancialProfile() {
  return useContext(ProfileContext);
}
