# 📱➡️🖥️ Flutter-Backend Integration Plan

## 🎯 **Mevcut Durum vs Hedef**

### ❌ **Şu Anki Durum (Local Only):**
```dart
// Flutter App - Local Storage
final group = await _storageService.createGroup(...);
// ↓
// In-memory Map: _groups[group.id] = group;
// ❌ Hiçbir API call yok
// ❌ Uygulama kapanınca data kaybolur
```

### ✅ **Hedef Durum (Backend Integration):**
```dart
// Flutter App - API Integration
final group = await _apiService.createGroup(...);
// ↓
// HTTP POST: /api/groups
// ↓ 
// Backend: Prisma.group.create(...)
// ↓
// PostgreSQL: INSERT INTO groups...
// ↓
// Response: Group object döner
```

---

## 🔄 **Integration Akışı**

### **1. Etkinlik Oluşturma (Create Group)**

#### Flutter Tarafı:
```dart
// lib/services/api_service.dart
class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  
  Future<Group> createGroup({
    required String title,
    required String description,
    required String type,
    required int targetCount,
    bool isPrivate = false,
    DateTime? deadline,
  }) async {
    final token = await _getAuthToken();
    
    final response = await http.post(
      Uri.parse('$baseUrl/groups'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'description': description,
        'type': type,
        'targetCount': targetCount,
        'isPrivate': isPrivate,
        'deadline': deadline?.toIso8601String(),
      }),
    );
    
    if (response.statusCode == 201) {
      return Group.fromMap(jsonDecode(response.body));
    }
    throw ApiException('Failed to create group');
  }
}
```

#### Backend API Endpoint:
```typescript
// backend/src/routes/groups.ts
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, type, targetCount, isPrivate, deadline } = req.body;
    const userId = req.user.id;
    
    // Create group in database
    const group = await prisma.group.create({
      data: {
        title,
        description,
        creatorId: userId,
        type,
        targetCount,
        isPrivate: isPrivate || false,
        deadline: deadline ? new Date(deadline) : null,
        inviteCode: generateInviteCode(),
      },
    });
    
    // Create group member record
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        role: 'creator',
      },
    });
    
    // Create initial tasks
    await createTasksForGroup(group);
    
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **2. Etkinlik Listeleme (Get Groups)**

#### Flutter:
```dart
Future<List<Group>> getUserGroups() async {
  final response = await http.get(
    Uri.parse('$baseUrl/groups'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((json) => Group.fromMap(json)).toList();
  }
  throw ApiException('Failed to load groups');
}
```

#### Backend:
```typescript
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        members: true,
        tasks: true,
        creator: {
          select: { id: true, username: true }
        }
      },
    });
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### **3. Görev Alma (Assign Task)**

#### Flutter:
```dart
Future<Task> assignTask(String groupId, String taskId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/groups/$groupId/tasks/$taskId/assign'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    return Task.fromMap(jsonDecode(response.body));
  }
  throw ApiException('Failed to assign task');
}
```

#### Backend:
```typescript
router.post('/:groupId/tasks/:taskId/assign', authenticateToken, async (req, res) => {
  try {
    const { groupId, taskId } = req.params;
    const userId = req.user.id;
    
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedTo: userId,
        status: 'assigned',
        assignedAt: new Date(),
      },
    });
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔧 **Implementation Steps**

### **Phase 6.1: HTTP Client Setup**
- [ ] `dio` package ekleme
- [ ] `ApiService` class oluşturma
- [ ] Error handling & retry logic
- [ ] Network connectivity check

### **Phase 6.2: Authentication Integration**
- [ ] JWT token storage (SecureStorage)
- [ ] Token refresh mechanism
- [ ] Login/Logout API integration
- [ ] User session management

### **Phase 6.3: Group APIs Integration**
- [ ] Create group API
- [ ] Get user groups API
- [ ] Join group API
- [ ] Update group API

### **Phase 6.4: Task APIs Integration**
- [ ] Get group tasks API
- [ ] Assign task API
- [ ] Complete task API
- [ ] Task progress sync

### **Phase 6.5: Prayer Tracking Integration**
- [ ] Daily prayer data sync
- [ ] Offline-first with sync
- [ ] Data conflict resolution

### **Phase 6.6: Real-time Features**
- [ ] WebSocket connection
- [ ] Live group updates
- [ ] Push notifications

---

## 📦 **Required Flutter Packages**

```yaml
dependencies:
  # HTTP Client
  dio: ^5.3.2
  
  # Secure Storage
  flutter_secure_storage: ^9.0.0
  
  # Connectivity
  connectivity_plus: ^4.0.2
  
  # State Management
  provider: ^6.1.1
  
  # WebSocket (Phase 6.6)
  web_socket_channel: ^2.4.0
```

---

## 🧪 **Testing Strategy**

### **Local Development:**
```dart
class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api';
  static const String socketUrl = 'ws://localhost:3000';
}
```

### **Production:**
```dart
class ApiConfig {
  static const String baseUrl = 'https://your-domain.com/api';
  static const String socketUrl = 'wss://your-domain.com';
}
```

---

## 📱 **User Experience Flow**

### **1. İlk Açılış:**
1. Check auth token
2. If valid → Load user data
3. If invalid → Show login screen

### **2. Etkinlik Oluşturma:**
1. User fills form
2. Validation
3. Show loading
4. API call to backend
5. Update local state
6. Show success message

### **3. Offline Handling:**
1. Store actions in local queue
2. Show "Syncing..." indicator
3. Retry when online
4. Merge conflicts if needed

---

## 🔄 **Data Sync Strategy**

### **Offline-First Approach:**
```dart
class DataSyncService {
  // Store local changes
  Future<void> queueAction(ApiAction action) async { ... }
  
  // Sync when online
  Future<void> syncPendingActions() async { ... }
  
  // Handle conflicts
  Future<void> resolveConflicts(List<Conflict> conflicts) async { ... }
}
```

---

*Bu plan Phase 6'da implement edilecek ve uygulamanız tam backend'e entegre olacak! 🚀* 