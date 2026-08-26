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
  getNextSyntheticMilestoneEventType,
  getNextSyntheticEventType,
  simulateNextCaseUpdate,
} from "../../domain/money-path";

export type LastSimulatedUpdate = {
  moneyPathId: string;
  eventType: ProcessEventType;
  occurredAt: string;
};

export const DEMO_CASE_ACCESS = {
  acknowledgementNumber: "NCRP-DEMO-2026-00124",
  registeredMobile: "98XXXXXX24",
} as const;

type DemoCaseContextValue = {
  caseData: Case;
  now: string;
  lastUpdate: LastSimulatedUpdate | null;
  isDemoAuthenticated: boolean;
  authenticateDemo: (acknowledgementNumber: string, registeredMobile: string) => boolean;
  hydrateComplaintCase: (caseData: Case, now: string) => void;
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

  const authenticateDemo = useCallback((acknowledgementNumber: string, registeredMobile: string) => {
    const matches =
      acknowledgementNumber.trim().toUpperCase() === DEMO_CASE_ACCESS.acknowledgementNumber &&
      registeredMobile.trim().toUpperCase() === DEMO_CASE_ACCESS.registeredMobile;

    if (matches) {
      setState((current) => ({ ...current, isDemoAuthenticated: true }));
    }

    return matches;
  }, []);

  const simulateNextUpdate = useCallback((moneyPathId: string) => {
    setState((current) => {
      const path = current.caseData.moneyPaths.find((item) => item.id === moneyPathId);
      if (!path) throw new Error(`Unknown money path: ${moneyPathId}`);

      const milestoneEventType = getNextSyntheticMilestoneEventType(path);
      if (!milestoneEventType) return current;

      let nextCase = current.caseData;
      let nextNow = current.now;
      let appendedEventType: ProcessEventType | null = null;

      for (let transitionIndex = 0; transitionIndex < 10; transitionIndex += 1) {
        const currentPath = nextCase.moneyPaths.find((item) => item.id === moneyPathId);
        if (!currentPath) throw new Error(`Unknown money path: ${moneyPathId}`);

        const eventType = getNextSyntheticEventType(currentPath);
        if (!eventType) break;

        nextNow = advanceSyntheticDateByOneDay(nextNow);
        nextCase = simulateNextCaseUpdate(nextCase, moneyPathId, nextNow);
        appendedEventType = eventType;

        if (eventType === milestoneEventType) break;
      }

      if (!appendedEventType) return current;

      return {
        ...current,
        caseData: nextCase,
        now: nextNow,
        lastUpdate: { moneyPathId, eventType: appendedEventType, occurredAt: nextNow },
      };
    });
  }, []);

  const hydrateComplaintCase = useCallback((caseData: Case, now: string) => {
    setState({
      caseData,
      now,
      lastUpdate: null,
      isDemoAuthenticated: true,
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState({
      caseData: initialCase,
      now: initialNow,
      lastUpdate: null,
      isDemoAuthenticated: false,
    });
  }, [initialCase, initialNow]);

  const value = useMemo(
    () => ({
      ...state,
      authenticateDemo,
      hydrateComplaintCase,
      simulateNextUpdate,
      resetDemo,
    }),
    [state, authenticateDemo, hydrateComplaintCase, simulateNextUpdate, resetDemo],
  );

  return <DemoCaseContext value={value}>{children}</DemoCaseContext>;
}

export function useDemoCase(): DemoCaseContextValue {
  const context = useContext(DemoCaseContext);
  if (!context) throw new Error("useDemoCase must be used within DemoCaseProvider.");
  return context;
}
