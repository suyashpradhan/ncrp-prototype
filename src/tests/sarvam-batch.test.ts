import { describe, expect, it } from "vitest";
import {
  decodeBatchJobToken,
  encodeBatchJobToken,
  safeCombinedBatchState,
} from "../incident/sarvam-batch";

describe("long Sarvam transcription boundary", () => {
  it("keeps provider job identifiers inside a short-lived signed client token", () => {
    const payload = {
      transcribeJobId: "job-original",
      translateJobId: "job-english",
      createdAt: Date.now(),
    };
    const token = encodeBatchJobToken(payload, "test-key");

    expect(decodeBatchJobToken(token, "test-key")).toEqual(payload);
    expect(() => decodeBatchJobToken(`${token}changed`, "test-key")).toThrow();
  });

  it("reports only safe combined processing states to the client", () => {
    expect(
      safeCombinedBatchState(
        { job_state: "Completed" },
        { job_state: "Completed" },
      ),
    ).toBe("COMPLETED");
    expect(
      safeCombinedBatchState(
        { job_state: "Running" },
        { job_state: "Accepted" },
      ),
    ).toBe("PROCESSING");
    expect(
      safeCombinedBatchState(
        { job_state: "Completed" },
        { job_state: "Failed", error_message: "provider detail" },
      ),
    ).toBe("FAILED");
  });
});
