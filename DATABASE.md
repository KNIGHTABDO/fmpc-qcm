# ZeroQCM — Database Reference

> Supabase project: `clcbqtkyrtntixdspxiw`

## Tables & Row Counts

| Table | Rows | Description |
|-------|-----:|---|
| `semesters` | ~25 | S1–S9 × 5 faculties |
| `modules` | ~500 | Modules per semester |
| `activities` | ~6,400 | QCM + exam sessions |
| `questions` | ~59,278 | Individual questions |
| `choices` | ~200,034 | Answer options |
| `profiles` | varies | User profiles |
| `user_answers` | varies | User answer history |
| `ai_explanations` | varies | Cached AI explanations |
| `comments` | varies | Per-question comments |
| `comment_likes` | varies | Comment likes |
| `bookmarks` | varies | User question bookmarks |
| `quiz_sessions` | varies | In-progress quiz session state |
| `study_rooms` | varies | Collaborative study rooms |
| `room_participants` | varies | Study room participants |
| `flashcard_progress` | varies | User flashcard session data |
| `ai_usage` | varies | Per-user AI quota consumption |
| `ai_models_config` | ~10 | AI model multipliers & config |
| `copilot_tokens` | varies | GitHub Copilot API token pool |

## Questions by Semester

| Semester | Questions |
|----------|----------:|
| S1 | ~59,278 |
| S3 | ~37,613 |
| S5 | ~38,653 |
| S7 | ~26,144 |
| S9 | ~18,962 |
| **Total** | **~180,650** |

## Key Constraints

- `bookmarks`: unique on `(user_id, question_id)` — upsert safe
- `quiz_sessions`: unique on `(user_id, activity_id)` — upserted on every answer
- `study_rooms`: unique on `code` — retry loop handles collisions
- `ai_usage`: composite key on `(user_id, usage_date, multiplier)`

## Export Full Database to CSV

```bash
# Get service_role key from: Supabase Dashboard -> Settings -> API -> service_role
export SUPABASE_URL=https://clcbqtkyrtntixdspxiw.supabase.co
export SUPABASE_SERVICE_KEY=<your_service_role_key>

# Run export (outputs CSV files to /export/)
node scripts/export-db.mjs

# Zip it
zip -r zerqcm-db-export.zip export/
```

Paginates in 1,000-row batches. Handles the full 180k+ dataset without timeout.

## Supabase Connection

```
Project ID:  clcbqtkyrtntixdspxiw
URL:         https://clcbqtkyrtntixdspxiw.supabase.co
```

Your keys are in:
- **Supabase** → Project → Settings → API → `service_role` (for export)
- **Vercel** → Project → Settings → Environment Variables
