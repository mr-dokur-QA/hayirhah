# 📊 Performance Optimization TODO List

> **App:** Hayırhah - Islamic Prayer & Group Activity App  
> **Target:** Scale to hundreds of thousands of users  
> **Created:** December 24, 2025  
> **Status:** In Progress

---

## 🔴 HIGH PRIORITY (Critical for Scale)

### 1. State Management Implementation

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 1.1 | Add Riverpod or Provider package for proper state management | ⬜ TODO | High - prevents unnecessary rebuilds |
| 1.2 | Convert singleton services to proper providers | ⬜ TODO | High - reactive state updates |
| 1.3 | Replace `setState()` calls with state notifiers | ⬜ TODO | High - granular rebuilds |
| 1.4 | Implement `Selector`/`Consumer` widgets for selective rebuilds | ⬜ TODO | Medium |

### 2. HTTP Client & Caching

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 2.1 | Replace `http` package with `dio` for interceptors & caching | ⬜ TODO | High |
| 2.2 | Implement response caching for prayer times API (cache daily) | ✅ DONE | High |
| 2.3 | Add proper request timeout handling | ⬜ TODO | Medium |
| 2.4 | Implement connection pooling and reuse | ⬜ TODO | Medium |

### 3. Offline-First Architecture

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 3.1 | Cache prayer times locally with expiration | ✅ DONE | High |
| 3.2 | Implement sync queue for offline actions | ⬜ TODO | High (for backend) |
| 3.3 | Add connectivity listener for online/offline state | ⬜ TODO | Medium |
| 3.4 | Cache location data and reuse when GPS unavailable | ✅ DONE | Medium |

---

## 🟠 MEDIUM PRIORITY (Performance Improvements)

### 4. Widget Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 4.1 | Add `const` constructors to all stateless widgets | ✅ DONE | Medium |
| 4.2 | Add `const` to widget constructors and literals | ✅ DONE | Medium |
| 4.3 | Use `RepaintBoundary` for compass/animation widgets | ⬜ TODO | Medium |
| 4.4 | Extract frequently rebuilt widgets to separate classes | ⬜ TODO | Medium |

### 5. List/Grid Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 5.1 | Add `key` property to list items for efficient diffing | ⬜ TODO | Medium |
| 5.2 | Use `ListView.builder` with `cacheExtent` for long lists | ⬜ TODO | Medium |
| 5.3 | Implement pagination for group tasks (30+ items) | ⬜ TODO | Medium |
| 5.4 | Add `AutomaticKeepAliveClientMixin` for tabs | ⬜ TODO | Low |

### 6. Storage Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 6.1 | Cache SharedPreferences instance (avoid repeated getInstance) | ✅ DONE | Medium |
| 6.2 | Consider Hive/Isar for complex data (prayer tracking) | ⬜ TODO | Medium |
| 6.3 | Batch SharedPreferences writes instead of individual calls | ⬜ TODO | Low |
| 6.4 | Implement data compression for large JSON storage | ⬜ TODO | Low |

### 7. Location Services Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 7.1 | Cache location with timestamp, refresh only if >15min old | ✅ DONE | Medium |
| 7.2 | Use `LocationAccuracy.low` for initial fast location | ⬜ TODO | Medium |
| 7.3 | Move location permission check to app startup | ⬜ TODO | Low |

---

## 🟡 LOW PRIORITY (Nice to Have)

### 8. Theme & Styling

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 8.1 | Cache ThemeData objects in ThemeService (create once) | ⬜ TODO | Low |
| 8.2 | Use theme extensions instead of inline color definitions | ⬜ TODO | Low |
| 8.3 | Reduce `withOpacity()` calls (creates new color objects) | ⬜ TODO | Low |

### 9. Animation Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 9.1 | Use `AnimatedContainer` instead of manual AnimationController where possible | ⬜ TODO | Low |
| 9.2 | Dispose unused AnimationControllers promptly | ⬜ TODO | Low |
| 9.3 | Use `vsync: this` optimization consistently | ⬜ TODO | Low |

### 10. Image & Asset Optimization

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 10.1 | Add 2x and 3x image variants for different screen densities | ⬜ TODO | Low |
| 10.2 | Compress audio files (azan sounds are ~4-8MB each) | ⬜ TODO | Low |
| 10.3 | Use `precacheImage` for frequently used images | ⬜ TODO | Low |

---

## 🔵 BACKEND INTEGRATION (When Backend is Ready)

### 11. API Integration

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 11.1 | Implement JWT token refresh logic with interceptors | ⬜ TODO | High |
| 11.2 | Add request retry with exponential backoff | ⬜ TODO | Medium |
| 11.3 | Implement optimistic UI updates for better UX | ⬜ TODO | Medium |
| 11.4 | Add GraphQL or batch endpoints to reduce API calls | ⬜ TODO | Medium |
| 11.5 | Implement WebSocket for real-time group updates | ⬜ TODO | Medium |

### 12. Data Sync

| ID | Task | Status | Impact |
|----|------|--------|--------|
| 12.1 | Implement conflict resolution for offline edits | ⬜ TODO | High |
| 12.2 | Add background sync for prayer tracking data | ⬜ TODO | Medium |
| 12.3 | Implement delta sync (only changed data) | ⬜ TODO | Medium |

---

## 📋 Quick Wins (Implement First)

These can be done quickly with high impact:

| # | Task | Time Est. | Benefit |
|---|------|-----------|---------|
| 1 | Add `const` to all widget constructors | 30min | Prevents widget rebuilds |
| 2 | Cache SharedPreferences instance | 15min | Reduces async calls |
| 3 | Cache prayer times for 24 hours | 30min | Reduces API calls dramatically |
| 4 | Add location caching | 30min | Faster app startup |
| 5 | Replace http with dio | 1hr | Enables interceptors & caching |

---

## 🗓️ Recommended Implementation Phases

### Phase 1: Quick Wins (1-2 days)
```
├── const constructors
├── SharedPreferences caching
├── Prayer times caching
└── Location caching
```

### Phase 2: State Management (3-5 days)
```
├── Add Riverpod
├── Convert services to providers
└── Optimize rebuilds
```

### Phase 3: Network Layer (2-3 days)
```
├── Dio integration
├── Response caching
└── Offline support
```

### Phase 4: Backend Integration (when ready)
```
├── JWT handling
├── Sync queue
└── WebSocket
```

---

## 📈 Progress Tracking

### Legend
- ⬜ TODO - Not started
- 🔄 IN PROGRESS - Currently working on
- ✅ DONE - Completed
- ❌ CANCELLED - No longer needed

### Summary
| Priority | Total | Done | In Progress | Remaining |
|----------|-------|------|-------------|-----------|
| 🔴 High | 12 | 3 | 0 | 9 |
| 🟠 Medium | 16 | 4 | 0 | 12 |
| 🟡 Low | 9 | 0 | 0 | 9 |
| 🔵 Backend | 8 | 0 | 0 | 8 |
| **Total** | **45** | **7** | **0** | **38** |

---

## 📝 Implementation Notes

### Files to Modify (Main Targets)

**Services:**
- `lib/services/storage_service.dart` - Add SharedPreferences caching
- `lib/services/prayer_times_service.dart` - Add response caching
- `lib/services/api_service.dart` - Replace with Dio
- `lib/services/theme_service.dart` - Cache ThemeData

**Screens (Widget Optimization):**
- `lib/screens/dashboard/dashboard_screen.dart`
- `lib/screens/prayer_tracking/ibadet_takip_screen.dart`
- `lib/screens/group/group_detail_screen.dart`
- `lib/screens/qibla/qibla_finder_screen.dart`

**New Files to Create:**
- `lib/providers/` - State management providers
- `lib/core/network/` - Dio client & interceptors
- `lib/core/cache/` - Caching utilities

---

## 🔗 Related Documentation

- [Flutter Performance Best Practices](https://docs.flutter.dev/perf/best-practices)
- [Riverpod Documentation](https://riverpod.dev/)
- [Dio Package](https://pub.dev/packages/dio)
- [Hive Database](https://pub.dev/packages/hive)

---

*Last Updated: December 24, 2025 - SharedPreferences, Prayer Cache & const constructors implemented*

