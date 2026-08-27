"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type JourneyNavigationControls = {
  onBack: () => void;
  onHome: () => void;
};

type JourneyNavigationContextValue = {
  controls: JourneyNavigationControls | null;
  registerControls: (
    controls: JourneyNavigationControls,
  ) => () => void;
};

const JourneyNavigationContext =
  createContext<JourneyNavigationContextValue | null>(null);

export function JourneyNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [controls, setControls] =
    useState<JourneyNavigationControls | null>(null);

  const registerControls = useCallback(
    (nextControls: JourneyNavigationControls) => {
      setControls(nextControls);
      return () => {
        setControls((current) =>
          current === nextControls ? null : current,
        );
      };
    },
    [],
  );

  const value = useMemo(
    () => ({ controls, registerControls }),
    [controls, registerControls],
  );

  return (
    <JourneyNavigationContext.Provider value={value}>
      {children}
    </JourneyNavigationContext.Provider>
  );
}

export function useJourneyNavigation() {
  const value = useContext(JourneyNavigationContext);
  if (!value) {
    throw new Error(
      "useJourneyNavigation must be used inside JourneyNavigationProvider.",
    );
  }
  return value;
}
