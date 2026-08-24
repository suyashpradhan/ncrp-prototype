"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Case } from "../../domain/case";
import { advanceSyntheticDateByOneDay } from "../../domain/demo-time";
import type { ProcessEventType } from "../../domain/events";
import {
  getNextSyntheticEventType,
  simulateNextCaseUpdate,
} from "../../domain/money-path";

export type LastSimulatedUpdate = {
  moneyPathId: string;
  eventType: ProcessEventType;
  occurredAt: string;
};

export const DEMO_CREDENTIALS = {
  username: "test123",
  password: "password123",
} as const;

type DemoCaseContextValue = {
  caseData: Case;
  now: string;
  lastUpdate: LastSimulatedUpdate | null;
  isDemoAuthenticated: boolean;
  authenticateDemo: (username: string, password: string) => boolean;
  simulateNextUpdate: (moneyPathId: string) => void;
  resetDemo: () => void;
};

const DemoCaseContext = createContext<DemoCaseContextValue | null>(null);

type DemoCaseProviderProps = {
  children: ReactNode;
  initialCase: Case;
  initialNow: string;
};

type DemoState = {
  caseData: Case;
  now: string;
  lastUpdate: LastSimulatedUpdate | null;
  isDemoAuthenticated: boolean;
};

export function DemoCaseProvider({ children, initialCase, initialNow }: DemoCaseProviderProps) {
  const [state, setState] = useState<DemoState>(() => ({
    caseData: initialCase,
    now: initialNow,
    lastUpdate: null,
    isDemoAuthenticated: false,
  }));

  const authenticateDemo = useCallback((username: string, password: string) => {
    const matches =
      username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password;

    if (matches) {
      setState((current) => ({ ...current, isDemoAuthenticated: true }));
    }

    return matches;
  }, []);

  const simulateNextUpdate = useCallback((moneyPathId: string) => {
    setState((current) => {
      const path = current.caseData.moneyPaths.find((item) => item.id === moneyPathId);
      if (!path) throw new Error(`Unknown money path: ${moneyPathId}`);

      const eventType = getNextSyntheticEventType(path);
      if (!eventType) return current;

      const nextNow = advanceSyntheticDateByOneDay(current.now);
      return {
        ...current,
        caseData: simulateNextCaseUpdate(current.caseData, moneyPathId, nextNow),
        now: nextNow,
        lastUpdate: { moneyPathId, eventType, occurredAt: nextNow },
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState((current) => ({
      caseData: initialCase,
      now: initialNow,
      lastUpdate: null,
      isDemoAuthenticated: current.isDemoAuthenticated,
    }));
  }, [initialCase, initialNow]);

  const value = useMemo(
    () => ({ ...state, authenticateDemo, simulateNextUpdate, resetDemo }),
    [state, authenticateDemo, simulateNextUpdate, resetDemo],
  );

  return <DemoCaseContext value={value}>{children}</DemoCaseContext>;
}

export function useDemoCase(): DemoCaseContextValue {
  const context = useContext(DemoCaseContext);
  if (!context) throw new Error("useDemoCase must be used within DemoCaseProvider.");
  return context;
}
