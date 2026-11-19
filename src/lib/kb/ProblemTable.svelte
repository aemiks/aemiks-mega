<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { PROBLEMS, splitTicket } from '#lib/kb/problems';

  // `issues` maps a problem to the ticket filed for it: { parser: 'https://…/issues/1', … }
  let { ticket, issues = {} }: { ticket: number; issues?: Record<string, string> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const chans = (c: Record<string, number>) =>
    Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(' · ');
</script>

<p class="sum">
  <strong>{split.merged.length}</strong> reports in #{ticket}
  ({split.duplicates} export rows were repeats of the same id) ·
  <strong>{split.groups.length}</strong> {split.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br />{PROBLEMS[g.problem].title}<br /><small>{PROBLEMS[g.problem].what}</small></td>
        <td><strong>{g.reports.length}</strong></td>
        <td class="muted">{chans(g.channels)}</td>
        <td class="muted">{g.tenants.length}: {g.tenants.join(', ')}</td>
        <td class="muted">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if issues[g.problem]}<a href={issues[g.problem]}>{issues[g.problem].replace(/^.*\/issues\//, '#')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .muted, small { color: var(--muted); font-size: 0.85em; }
</style>
