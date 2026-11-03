# Banner Data Maintenance

## Update Schedule

Update `banner-schedule.json` on each phase switch day (approximately every 3 weeks):

- Genshin Impact versions have 2 phases each
- Each phase lasts ~21 days
- Phase switch days typically fall on Tuesdays (after weekly reset)

## Calendar (approximate)

| Version | Phase 1 Start | Phase 2 Start |
|---------|---------------|---------------|
| 7.1     | 2026-10-08    | 2026-10-28    |
| 7.2     | 2026-11-18    | 2026-12-09    |
| 7.3     | 2026-12-30    | 2027-01-20    |
| 7.4     | 2027-01-20    | 2027-02-10    |

## Update Checklist

1. Open `banner-schedule.json`
2. Move current phase data to `banner-history.json` (if archiving)
3. Update `phases[0]` with new current phase:
   - `id`, `label`, `version`
   - `startUtc`, `endUtc`
   - `character.name`, `element`, `weapon`, `role`, `rarity`
   - `fourStars[]`
4. Update `phases[1]` with next phase (or TBA if unknown)
5. Update `schedule.updated` to today's date (YYYY-MM-DD)
6. Run: `node scripts/generate-banner-pages.mjs`
7. Run: `npm run build`
8. Commit and push

## Automation

The GitHub Actions workflow (`.github/workflows/update-banners.yml`) runs weekly on Monday at 06:00 UTC. It attempts to fetch banner data and sends a Feishu notification if data is stale. However, the actual JSON update is manual since no stable free API exists for banner schedules.

## Data Format

```json
{
  "version": "7.2",
  "updated": "2026-11-03",
  "phases": [
    {
      "id": "7.2-1",
      "label": "Phase 1",
      "version": "7.2",
      "startUtc": "2026-11-18T18:00:00Z",
      "endUtc": "2026-12-09T17:59:59Z",
      "character": {
        "name": "Character Name",
        "rarity": 5,
        "element": "Element",
        "weapon": "Weapon Type",
        "role": "Role"
      },
      "fourStars": ["Name1", "Name2", "Name3"],
      "next": {
        "speculated": false,
        "character": "Next Character or TBA",
        "rarity": 5,
        "element": "TBA",
        "weapon": "TBA",
        "role": "TBA"
      }
    }
  ]
}
```

Use `"TBA"` for unknown values — the template handles this gracefully with "To be announced" fallbacks.
