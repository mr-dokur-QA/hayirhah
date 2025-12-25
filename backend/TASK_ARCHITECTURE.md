# Task Architecture Optimization

## Problem
Creating individual task records for numbered activities (Tefriciye: 4444, 1000 İhlas: 1000) creates massive database bloat and doesn't scale.

## Solution: Two-Tier Task System

### 1. Sectioned Tasks (Hatim, Cevşen, Yasin, Fetih)
- **Each section is a separate task** (e.g., each cüz in Hatim)
- **Creates task records** in `tasks` table
- **Reason:** Each section can be assigned to different users
- **Examples:**
  - Hatim: 30 tasks (one per cüz)
  - Cevşen: 100 tasks (one per bab)
  - Yasin: 41 tasks
  - Fetih: 19 tasks

### 2. Numbered Tasks (Tefriciye, 1000 İhlas)
- **No individual task records**
- **Uses `numbered_task_assignments` table** to track user progress
- **Reason:** Just counting, no need for individual assignments
- **Examples:**
  - Tefriciye: 4444 items (tracked via counter)
  - 1000 İhlas: 1000 items (tracked via counter)

## Database Schema

### New Model: `NumberedTaskAssignment`
```prisma
model NumberedTaskAssignment {
  id            String   @id @default(cuid())
  groupId       String
  userId        String
  assignedCount Int      @default(0)  // User committed to complete X items
  completedCount Int     @default(0)  // User actually completed X items
  assignedAt    DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([groupId, userId])
}
```

## API Changes

### Group Creation
- **Sectioned types:** Creates tasks automatically
- **Numbered types:** No tasks created, only group record

### Task Assignment
- **Sectioned types:** Use existing `/api/groups/:id/tasks/assign` endpoint
- **Numbered types:** New endpoint `/api/groups/:id/numbered-assignments/assign`
  - Body: `{ "count": 100 }` (user commits to complete 100 items)
  - Creates/updates `NumberedTaskAssignment` record

### Progress Tracking
- **Sectioned types:** Count completed tasks
- **Numbered types:** Sum `completedCount` from `numbered_task_assignments`

## Migration Required

```sql
CREATE TABLE numbered_task_assignments (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_numbered_task_assignments_group ON numbered_task_assignments(group_id);
CREATE INDEX idx_numbered_task_assignments_user ON numbered_task_assignments(user_id);
```

## Benefits

1. **Scalability:** 10,000 users × 4444 tasks = 44M records → Now: 10,000 assignment records
2. **Performance:** Faster queries, less storage
3. **Flexibility:** Users can commit to any amount (not fixed per task)
4. **Simplicity:** Numbered tasks are just counters

## Implementation Status

- ✅ Schema updated
- ✅ Backend logic updated (createGroupTasks)
- ⏳ Migration pending
- ⏳ API endpoints for numbered assignments
- ⏳ Flutter UI updates

