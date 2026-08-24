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

type DemoCaseContextValue = {
  caseData: Case;
  now: string;
  lastUpdate: LastSimulatedUpdate | null;
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
};

export function DemoCaseProvider({ children, initialCase, initialNow }: DemoCaseProviderProps) {
  const [state, setState] = useState<DemoState>(() => ({
    caseData: initialCase,
    now: initialNow,
    lastUpdate: null,
  }));

  const simulateNextUpdate = useCallback((moneyPathId: string) => {
    setState((current) => {
      const path = current.caseData.moneyPaths.find((item) => item.id === moneyPathId);
      if (!path) throw new Error(`Unknown money path: ${moneyPathId}`);

      const eventType = getNextSyntheticEventType(path);
      if (!eventType) return current;

      const nextNow = advanceSyntheticDateByOneDay(current.now);
      return {
        caseData: simulateNextCaseUpdate(current.caseData, moneyPathId, nextNow),
        now: nextNow,
        lastUpdate: { moneyPathId, eventType, occurredAt: nextNow },
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState({ caseData: initialCase, now: initialNow, lastUpdate: null });
  }, [initialCase, initialNow]);

  const value = useMemo(
    () => ({ ...state, simulateNextUpdate, resetDemo }),
    [state, simulateNextUpdate, resetDemo],
  );

  return <DemoCaseContext value={value}>{children}</DemoCaseContext>;
}

export function useDemoCase(): DemoCaseContextValue {
  const context = useContext(DemoCaseContext);
  if (!context) throw new Error("useDemoCase must be used within DemoCaseProvider.");
  return context;
}
