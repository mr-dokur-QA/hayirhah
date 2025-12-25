import 'dart:math';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import '../models/group.dart';
import '../models/task.dart';
import '../models/notification_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  // Cached SharedPreferences instance - PERFORMANCE OPTIMIZATION
  static SharedPreferences? _prefs;
  static bool _isInitialized = false;

  /// Initialize SharedPreferences cache. Call this once at app startup.
  static Future<void> initialize() async {
    if (!_isInitialized) {
      _prefs = await SharedPreferences.getInstance();
      _isInitialized = true;
    }
  }

  /// Get cached SharedPreferences instance
  Future<SharedPreferences> get _sharedPrefs async {
    if (_prefs == null) {
      await initialize();
    }
    return _prefs!;
  }

  /// Synchronous access to prefs (only use after initialization)
  SharedPreferences? get _prefsSync => _prefs;

  // Keys for SharedPreferences
  static const String _themeKey = 'theme_mode';
  static const String _notificationPrefsKey = 'notification_preferences';
  static const String _prayerTimesKey = 'prayer_times';
  static const String _prayerTimesCacheKey = 'prayer_times_cache_timestamp';
  static const String _locationKey = 'location';
  static const String _locationCacheKey = 'location_cache_timestamp';
  static const String _manualCityKey = 'manual_city';

  // Cache duration constants
  static const Duration prayerTimesCacheDuration = Duration(hours: 24);
  static const Duration locationCacheDuration = Duration(minutes: 15);

  // In-memory storage
  final Map<String, User> _users = {};
  final Map<String, Group> _groups = {};
  final Map<String, Task> _tasks = {};
  NotificationPreferences _notificationPrefs = NotificationPreferences();
  
  // Current user
  User? _currentUser;
  User? get currentUser => _currentUser;

  // Theme preference methods
  Future<bool?> getThemePreference() async {
    final prefs = await _sharedPrefs;
    final themeMode = prefs.getString(_themeKey);
    if (themeMode == null) return null;
    return themeMode == 'dark';
  }

  Future<void> saveThemePreference(bool isDarkMode) async {
    final prefs = await _sharedPrefs;
    await prefs.setString(_themeKey, isDarkMode ? 'dark' : 'light');
  }

  // Theme mode methods (for compatibility)
  Future<void> saveThemeMode(String themeMode) async {
    final prefs = await _sharedPrefs;
    await prefs.setString(_themeKey, themeMode);
  }

  Future<String> getThemeMode() async {
    final prefs = await _sharedPrefs;
    return prefs.getString(_themeKey) ?? 'system';
  }

  // Notification preferences methods
  Future<NotificationPreferences> getNotificationPreferences() async {
    final prefs = await _sharedPrefs;
    final jsonString = prefs.getString(_notificationPrefsKey);
    
    if (jsonString != null) {
      final json = jsonDecode(jsonString);
      return NotificationPreferences(
        enabled: json['enabled'] ?? true,
        earlyReminderMinutes: json['earlyReminderMinutes'] ?? 15,
        volume: json['volume'] ?? 1.0,
        vibrate: json['vibrate'] ?? true,
        prayerNotifications: Map<String, bool>.from(json['prayerNotifications'] ?? {}),
        selectedAzanId: json['selectedAzanId'],
      );
    }
    
    return NotificationPreferences();
  }

  Future<void> saveNotificationPreferences(NotificationPreferences preferences) async {
    final prefs = await _sharedPrefs;
    final json = {
      'enabled': preferences.enabled,
      'earlyReminderMinutes': preferences.earlyReminderMinutes,
      'volume': preferences.volume,
      'vibrate': preferences.vibrate,
      'prayerNotifications': preferences.prayerNotifications,
      'selectedAzanId': preferences.selectedAzanId,
    };
    await prefs.setString(_notificationPrefsKey, jsonEncode(json));
    _notificationPrefs = preferences;
  }

  Future<void> updateNotificationPreferences({
    bool? enabled,
    int? earlyReminderMinutes,
    Map<String, bool>? prayerNotifications,
    double? volume,
    bool? vibrate,
    String? selectedAzanId,
  }) async {
    _notificationPrefs = _notificationPrefs.copyWith(
      enabled: enabled,
      earlyReminderMinutes: earlyReminderMinutes,
      prayerNotifications: prayerNotifications,
      volume: volume,
      vibrate: vibrate,
      selectedAzanId: selectedAzanId,
    );
    await saveNotificationPreferences(_notificationPrefs);
  }

  // Prayer times storage with 24-hour cache
  Future<void> savePrayerTimes(Map<String, dynamic> prayerTimes) async {
    final prefs = await _sharedPrefs;
    await prefs.setString(_prayerTimesKey, jsonEncode(prayerTimes));
    await prefs.setInt(_prayerTimesCacheKey, DateTime.now().millisecondsSinceEpoch);
  }

  Future<Map<String, dynamic>?> getPrayerTimes() async {
    final prefs = await _sharedPrefs;
    final jsonString = prefs.getString(_prayerTimesKey);
    if (jsonString != null) {
      return jsonDecode(jsonString);
    }
    return null;
  }

  /// Check if prayer times cache is still valid (less than 24 hours old)
  Future<bool> isPrayerTimesCacheValid() async {
    final prefs = await _sharedPrefs;
    final cacheTimestamp = prefs.getInt(_prayerTimesCacheKey);
    if (cacheTimestamp == null) return false;
    
    final cacheTime = DateTime.fromMillisecondsSinceEpoch(cacheTimestamp);
    final now = DateTime.now();
    
    // Cache is valid if it's from today AND less than 24 hours old
    final isSameDay = cacheTime.year == now.year && 
                      cacheTime.month == now.month && 
                      cacheTime.day == now.day;
    final isWithinDuration = now.difference(cacheTime) < prayerTimesCacheDuration;
    
    return isSameDay && isWithinDuration;
  }

  /// Get cached prayer times if valid, otherwise return null
  Future<Map<String, dynamic>?> getCachedPrayerTimes() async {
    if (await isPrayerTimesCacheValid()) {
      return getPrayerTimes();
    }
    return null;
  }

  // Location storage with 15-minute cache
  Future<void> saveLocation(double latitude, double longitude) async {
    final prefs = await _sharedPrefs;
    await prefs.setString(_locationKey, jsonEncode({
      'latitude': latitude,
      'longitude': longitude,
    }));
    await prefs.setInt(_locationCacheKey, DateTime.now().millisecondsSinceEpoch);
  }

  Future<Map<String, double>?> getLocation() async {
    final prefs = await _sharedPrefs;
    final jsonString = prefs.getString(_locationKey);
    if (jsonString != null) {
      final json = jsonDecode(jsonString);
      return {
        'latitude': json['latitude'],
        'longitude': json['longitude'],
      };
    }
    return null;
  }

  /// Check if location cache is still valid (less than 15 minutes old)
  Future<bool> isLocationCacheValid() async {
    final prefs = await _sharedPrefs;
    final cacheTimestamp = prefs.getInt(_locationCacheKey);
    if (cacheTimestamp == null) return false;
    
    final cacheTime = DateTime.fromMillisecondsSinceEpoch(cacheTimestamp);
    return DateTime.now().difference(cacheTime) < locationCacheDuration;
  }

  /// Get cached location if valid, otherwise return null
  Future<Map<String, double>?> getCachedLocation() async {
    if (await isLocationCacheValid()) {
      return getLocation();
    }
    return null;
  }

  // Manual city selection methods (for users who don't want to share location)
  Future<void> saveManualCity(dynamic city) async {
    final prefs = await _sharedPrefs;
    if (city == null) {
      await prefs.remove(_manualCityKey);
    } else {
      await prefs.setString(_manualCityKey, jsonEncode(city.toMap()));
    }
  }

  Future<void> clearManualCity() async {
    final prefs = await _sharedPrefs;
    await prefs.remove(_manualCityKey);
  }

  Future<dynamic> getManualCity() async {
    final prefs = await _sharedPrefs;
    final jsonString = prefs.getString(_manualCityKey);
    if (jsonString != null) {
      // Import dynamically to avoid circular dependency
      final map = jsonDecode(jsonString) as Map<String, dynamic>;
      return _TurkishCityData(
        name: map['name'] ?? '',
        latitude: (map['latitude'] as num).toDouble(),
        longitude: (map['longitude'] as num).toDouble(),
      );
    }
    return null;
  }

  // Generate unique ID
  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString() + 
           Random().nextInt(1000).toString();
  }

  // Generate invite code
  String _generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = Random();
    return String.fromCharCodes(Iterable.generate(
      6, (_) => chars.codeUnitAt(random.nextInt(chars.length))));
  }

  // User operations
  Future<User> createUser({
    required String username,
    required String email,
    String? profilePhotoUrl,
  }) async {
    final user = User(
      id: _generateId(),
      username: username,
      email: email,
      profilePhotoUrl: profilePhotoUrl,
      createdAt: DateTime.now(),
    );
    _users[user.id] = user;
    return user;
  }

  Future<User?> loginUser(String email, String password) async {
    // Demo mode: Create user if doesn't exist, no password validation
    User? user = _users.values.firstWhere(
      (u) => u.email.toLowerCase() == email.toLowerCase(),
      orElse: () => User(
        id: _generateId(),
        username: email.split('@')[0],
        email: email,
        createdAt: DateTime.now(),
      ),
    );
    
    _currentUser = user;
    return user;
  }

  Future<User?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        return null; // User cancelled the sign-in
      }

      // Create or get existing user
      final user = _users.values.firstWhere(
        (u) => u.email == googleUser.email,
        orElse: () => User(
          id: _generateId(),
          username: googleUser.displayName ?? googleUser.email.split('@')[0],
          email: googleUser.email,
          profilePhotoUrl: googleUser.photoUrl,
          createdAt: DateTime.now(),
        ),
      );
      
      _currentUser = user;
      _users[user.id] = user;
      return user;
    } catch (error) {
      print('Google Sign-In error: $error');
      return null;
    }
  }

  Future<void> signOutGoogle() async {
    await _googleSignIn.signOut();
    _currentUser = null;
  }

  Future<void> logoutUser() async {
    _currentUser = null;
  }

  void logout() {
    _currentUser = null;
  }

  Future<User?> getUserById(String id) async {
    return _users[id];
  }

  User? getUserByIdSync(String userId) {
    return _users[userId];
  }

  Future<List<User>> getAllUsers() async {
    return _users.values.toList();
  }

  Future<User?> findUserByEmail(String email) async {
    try {
      return _users.values.firstWhere(
        (user) => user.email.toLowerCase() == email.toLowerCase(),
      );
    } catch (e) {
      return null; // User not found
    }
  }

  // Group operations
  Future<Group> createGroup({
    required String title,
    required String description,
    required String type,
    required int targetCount,
    bool isPrivate = false,
    DateTime? deadline,
  }) async {
    if (_currentUser == null) throw Exception('User not logged in');

    final group = Group(
      id: _generateId(),
      title: title,
      description: description,
      creatorId: _currentUser!.id,
      type: type,
      targetCount: targetCount,
      isPrivate: isPrivate,
      deadline: deadline,
      inviteCode: _generateInviteCode(),
      createdAt: DateTime.now(),
      participantIds: [_currentUser!.id],
    );

    _groups[group.id] = group;

    // Create tasks for the group
    await _createTasksForGroup(group);

    return group;
  }

  Future<void> _createTasksForGroup(Group group) async {
    if (group.type == 'hatim') {
      // 30 cüz için görevler oluştur
      for (int i = 1; i <= 30; i++) {
        final task = Task(
          id: _generateId(),
          groupId: group.id,
          taskIndex: i,
        );
        _tasks[task.id] = task;
      }
    } else if (group.type == 'cevsen') {
      // Cevşen-ül Kebir: 100 bab, 20 görev (her biri 5 bab)
      // 1-5, 6-10, 11-15, ... 96-100
      for (int i = 1; i <= 20; i++) {
        final task = Task(
          id: _generateId(),
          groupId: group.id,
          taskIndex: i,
          amount: 5, // Her görev 5 bab
        );
        _tasks[task.id] = task;
      }
    }
    // Tefriciye, Yasin ve Fetih için default görev oluşturmuyoruz
    // Kullanıcılar dinamik görev oluşturacak
  }

  Future<List<Group>> getUserGroups([String? userId]) async {
    final targetUserId = userId ?? _currentUser?.id;
    if (targetUserId == null) return [];
    
    return _groups.values
        .where((group) => group.participantIds.contains(targetUserId))
        .toList();
  }

  Future<Group?> getGroupById(String groupId) async {
    return _groups[groupId];
  }

  Future<Group?> joinGroupByInviteCode(String inviteCode) async {
    if (_currentUser == null) return null;

    final group = _groups.values.firstWhere(
      (g) => g.inviteCode == inviteCode,
      orElse: () => throw Exception('Invalid invite code'),
    );

    if (!group.participantIds.contains(_currentUser!.id)) {
      final updatedGroup = group.copyWith(
        participantIds: [...group.participantIds, _currentUser!.id],
      );
      _groups[group.id] = updatedGroup;
      return updatedGroup;
    }

    return group;
  }

  Future<Group?> updateGroupInfo(String groupId, String newTitle, String newDescription) async {
    if (_currentUser == null) return null;

    final group = _groups[groupId];
    if (group == null || group.creatorId != _currentUser!.id) return null;

    final updatedGroup = group.copyWith(
      title: newTitle,
      description: newDescription,
    );

    _groups[groupId] = updatedGroup;
    return updatedGroup;
  }

  Future<bool> addUserToGroup(String groupId, String userId) async {
    final group = _groups[groupId];
    if (group == null) return false;

    if (!group.participantIds.contains(userId)) {
      final updatedGroup = group.copyWith(
        participantIds: [...group.participantIds, userId],
      );
      _groups[groupId] = updatedGroup;
      return true;
    }

    return false; // User already in group
  }

  List<User> getGroupParticipants(String groupId) {
    final group = _groups[groupId];
    if (group == null) return [];

    return group.participantIds
        .map((id) => _users[id])
        .where((user) => user != null)
        .cast<User>()
        .toList();
  }

  // Task operations
  Future<List<Task>> getGroupTasks(String groupId) async {
    return _tasks.values
        .where((task) => task.groupId == groupId)
        .toList()
        ..sort((a, b) => a.taskIndex.compareTo(b.taskIndex));
  }

  Future<Task?> assignTask(String taskId) async {
    if (_currentUser == null) return null;

    final task = _tasks[taskId];
    if (task == null || task.status != 'available') return null;

    final updatedTask = task.copyWith(
      assignedTo: _currentUser!.id,
      status: 'assigned',
      assignedAt: DateTime.now(),
    );

    _tasks[taskId] = updatedTask;
    return updatedTask;
  }

  Future<Task?> completeTask(String taskId) async {
    if (_currentUser == null) return null;

    final task = _tasks[taskId];
    if (task == null || task.assignedTo != _currentUser!.id) return null;

    final updatedTask = task.copyWith(
      status: 'completed',
      completedAt: DateTime.now(),
    );

    _tasks[taskId] = updatedTask;

    // Update group progress
    await _updateGroupProgress(task.groupId);

    return updatedTask;
  }

  Future<Task?> createDynamicTask({
    required String groupId,
    required String userId,
    required int amount,
  }) async {
    final group = _groups[groupId];
    if (group == null) return null;

    // Kalan görev sayısını kontrol et
    final groupTasks = await getGroupTasks(groupId);
    final completedAmount = groupTasks
        .where((task) => task.status == 'completed')
        .fold(0, (sum, task) => sum + (task.amount ?? 0));
    
    final assignedAmount = groupTasks
        .where((task) => task.status == 'assigned')
        .fold(0, (sum, task) => sum + (task.amount ?? 0));
    
    final remainingCount = group.targetCount - completedAmount - assignedAmount;
    
    if (amount > remainingCount) {
      throw Exception('Yeterli görev kalmamış. Kalan: $remainingCount');
    }

    // Yeni dinamik görev oluştur
    final task = Task(
      id: _generateId(),
      groupId: groupId,
      taskIndex: groupTasks.length + 1, // Sıradaki görev numarası
      assignedTo: userId,
      status: 'assigned',
      assignedAt: DateTime.now(),
      amount: amount,
    );

    _tasks[task.id] = task;
    return task;
  }

  Future<void> _updateGroupProgress(String groupId) async {
    final group = _groups[groupId];
    if (group == null) return;

    final groupTasks = await getGroupTasks(groupId);
    
    // For tefriciye, yasin, fetih, cevsen, and 1000_ihlas groups, calculate progress based on amount
    // For hatim groups, calculate progress based on task count
    int completedProgress;
    if (group.type == 'tefriciye' || group.type == 'yasin' || group.type == 'fetih' || group.type == 'cevsen' || group.type == '1000_ihlas') {
      completedProgress = groupTasks
          .where((task) => task.status == 'completed')
          .fold(0, (sum, task) => sum + (task.amount ?? 0));
    } else {
      completedProgress = groupTasks.where((t) => t.status == 'completed').length;
    }

    final updatedGroup = group.copyWith(currentProgress: completedProgress);
    _groups[groupId] = updatedGroup;
  }

  Future<void> updateGroupProgress(String groupId, int completedCount) async {
    final group = _groups[groupId];
    if (group == null) return;

    final updatedGroup = group.copyWith(currentProgress: completedCount);
    _groups[groupId] = updatedGroup;
  }

  // Türkçe tarih formatı için yardımcı fonksiyon
  static String formatDateTurkish(DateTime date) {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    return '${date.day} ${months[date.month - 1]}, ${date.year}';
  }
}

/// Simple data class for manual city (to avoid circular imports)
class _TurkishCityData {
  final String name;
  final double latitude;
  final double longitude;

  _TurkishCityData({
    required this.name,
    required this.latitude,
    required this.longitude,
  });

  Map<String, dynamic> toMap() => {
    'name': name,
    'latitude': latitude,
    'longitude': longitude,
  };
} 