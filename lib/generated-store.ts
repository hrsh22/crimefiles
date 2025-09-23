// Ephemeral in-memory store for generated case during session
// Not persisted across refreshes or server restarts

let latestCaseJson: unknown | null = null;

export function setLatestGeneratedCase(data: unknown) {
    latestCaseJson = data;
}

export function getLatestGeneratedCase(): unknown | null {
    return latestCaseJson;
}


