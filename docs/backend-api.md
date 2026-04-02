# BassTab Backend API Boundary

This project now has a frontend backend-boundary module in `src/api/`:

- `src/api/contracts.ts`: DTO contracts + response payload validation
- `src/api/bassTabApi.ts`: typed HTTP client (`BassTabApi`)
- `src/api/mappers.ts`: domain model <-> DTO mappers

## Endpoint shape (v1)

1. `GET /v1/songs` -> `SongMetadataDto[]`
2. `GET /v1/songs/:songId` -> `SongDto`
3. `POST /v1/songs` -> `SongDto`
4. `PATCH /v1/songs/:songId/metadata` -> `SongMetadataDto`
5. `PUT /v1/songs/:songId/chart` -> `SongChartDto`
6. `DELETE /v1/songs/:songId` -> `204`
7. `GET /v1/playlist` -> `PlaylistDto`
8. `PUT /v1/playlist/order` -> `PlaylistDto`

## Data modeling recommendation

Store song metadata in regular columns and chart structure in JSON:

- `songs`: `id`, `title`, `artist`, `key`, `feel_note`, `tuning`, `updated_at`
- `song_chart_json`: JSON/JSONB object with:
  - `stringNames: string[]`
  - `rows: SongRow[]` (including bars/cells)
- `playlist` table: `id`, `name`, `updated_at`
- `playlist_song` table: `playlist_id`, `song_id`, `position`

For Postgres, use `JSONB` for chart payloads and index metadata columns (`title`, `artist`, `updated_at`) separately.

## Runtime config

Set `EXPO_PUBLIC_BASSTAB_API_URL` to enable the HTTP client factory:

- `createBassTabApiFromEnv()` returns `null` when unset
- this allows gradual migration from local-only persistence to backend sync
