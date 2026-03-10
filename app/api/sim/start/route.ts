import type { SimEvent } from "../state/route"

declare global {
  // eslint-disable-next-line no-var
  var __SIM_STATE__: { events: SimEvent[] } | undefined
}

function getState() {
  if (!global.__SIM_STATE__) global.__SIM_STATE__ = { events: [] }
  return global.__SIM_STATE__
}

export async function POST(req: Request) {
  const body = (await req.json()) as SimEvent
  const st = getState()
  st.events = [...st.events, body]
  return Response.json(st)
}
