export type SimEvent =
  | { kind: "leak"; pipeId: string }
  | { kind: "contamination"; at: { lat: number; lng: number } }
  | { kind: "pump_failure"; nodeId: string }

declare global {
  // eslint-disable-next-line no-var
  var __SIM_STATE__: { events: SimEvent[] } | undefined
}

function getState() {
  if (!global.__SIM_STATE__) global.__SIM_STATE__ = { events: [] }
  return global.__SIM_STATE__
}

export async function GET() {
  return Response.json(getState())
}
