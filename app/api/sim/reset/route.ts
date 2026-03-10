declare global {
  // eslint-disable-next-line no-var
  var __SIM_STATE__: { events: any[] } | undefined
}

export async function POST() {
  global.__SIM_STATE__ = { events: [] }
  return Response.json(global.__SIM_STATE__)
}
