// The problems inside a merged ticket. causes.ts places a report by its tenant; this file adds what
// the tenant cannot tell: reports whose date moved by one day, which the desk read (desk-notes.json)
// and which no locale or form explains. Those are their own problem, not a footnote under `parser`.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export const PROBLEMS: Record<Problem, { title: string; what: string }> = {
  parser: {
    title: 'Shared date parser reads day-first dates month first',
    what: 'Day-first tenants (app, email, booking-v2 form): 7/4 becomes 4 July instead of 7 April.',
  },
  hint: {
    title: 'booking-v3 form hint says MM/DD/YYYY to day-first tenants',
    what: 'People type month first as the hint tells them; the form reads it the tenant’s way, day first.',
  },
  'one-day': {
    title: 'Booking date shifts by one day',
    what: 'Same month, one day earlier or later; differs by the viewer’s time zone. Not a day/month swap.',
  },
  unplaced: { title: 'No tenant on file', what: 'Cannot be placed without a tenant.' },
};

export function problemOf(r: Report, t: Tenant | undefined, oneDay: readonly string[]): Problem {
  if (oneDay.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDay: readonly string[],
): { merged: Report[]; duplicates: number; groups: ProblemGroup[] } {
  const inTicket = all.filter((r) => r.mergedInto === ticket);
  const merged = uniqueById(inTicket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDay);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { merged, duplicates: inTicket.length - merged.length, groups };
}
