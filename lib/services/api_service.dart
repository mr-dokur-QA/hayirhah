import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/network/dio_client.dart';

/// API Service using Dio for HTTP requests
/// Features: Interceptors, retry logic, timeout handling, JWT support
class ApiService {
  final DioClient _client = DioClient();

  // Endpoints
  static const String _authRegister = '/auth/register';
  static const String _authLogin = '/auth/login';
  static const String _authProfile = '/auth/profile';
  static const String _groups = '/groups';
  static const String _groupsJoin = '/groups/join';
  static const String _prayerTracking = '/prayer-tracking';

  /// Set auth token
  void setAuthToken(String token) {
    _client.setAuthToken(token);
  }

  /// Clear auth token
  void clearAuthToken() {
    _client.clearAuth();
  }

  // ==================== Authentication ====================

  /// Register a new user
  Future<Map<String, dynamic>?> register({
    required String email,
    required String username,
    required String password,
  }) async {
    try {
      final response = await _client.post(
        _authRegister,
        data: {
          'email': email,
          'username': username,
          'password': password,
        },
      );

      if (response.statusCode == 201) {
        final data = response.data;
        final token = data['tokens']?['accessToken'];
        if (token != null) {
          _client.setAuthToken(token);
        }
        return data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Register', e);
      return null;
    }
  }

  /// Login with email and password
  Future<Map<String, dynamic>?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.post(
        _authLogin,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        // Backend returns tokens directly or in data.tokens
        final token = data['tokens']?['accessToken'] ?? data['data']?['tokens']?['accessToken'];
        if (token != null) {
          _client.setAuthToken(token);
        }
        return data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Login', e);
      return null;
    }
  }

  /// Get user profile
  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await _client.get(_authProfile);

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Get profile', e);
      return null;
    }
  }

  // ==================== Group Management ====================

  /// Create a new group
  Future<Map<String, dynamic>?> createGroup({
    required String title,
    String? description,
    required String type,
    required int targetCount,
    bool isPrivate = false,
    String? deadline,
  }) async {
    try {
      final requestBody = <String, dynamic>{
        'title': title,
        'type': type,
        'targetCount': targetCount,
        'isPrivate': isPrivate,
      };

      if (description != null) requestBody['description'] = description;
      if (deadline != null) requestBody['deadline'] = deadline;

      final response = await _client.post(_groups, data: requestBody);

      if (response.statusCode == 201) {
        debugPrint('✅ Group created: ${response.data['data']['inviteCode']}');
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Create group', e);
      return null;
    }
  }

  /// Get user's groups
  Future<List<Map<String, dynamic>>?> getUserGroups() async {
    try {
      final response = await _client.get(_groups);

      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
      return null;
    } on DioException catch (e) {
      _handleError('Get user groups', e);
      return null;
    }
  }

  /// Join a group with invite code
  Future<Map<String, dynamic>?> joinGroup(String inviteCode) async {
    try {
      final response = await _client.post(
        _groupsJoin,
        data: {'inviteCode': inviteCode},
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Join group', e);
      return null;
    }
  }

  /// Get group details
  Future<Map<String, dynamic>?> getGroupDetails(String groupId) async {
    try {
      final response = await _client.get('$_groups/$groupId');

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Get group details', e);
      return null;
    }
  }

  /// Get group tasks
  Future<List<Map<String, dynamic>>?> getGroupTasks(String groupId) async {
    try {
      final response = await _client.get('$_groups/$groupId/tasks');

      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
      return null;
    } on DioException catch (e) {
      _handleError('Get group tasks', e);
      return null;
    }
  }

  /// Assign a task
  Future<Map<String, dynamic>?> assignTask(String groupId, String taskId) async {
    try {
      final response = await _client.post(
        '$_groups/$groupId/tasks/assign',
        data: {'taskId': taskId},
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Assign task', e);
      return null;
    }
  }

  /// Complete a task
  Future<Map<String, dynamic>?> completeTask(String groupId, String taskId) async {
    try {
      final response = await _client.post(
        '$_groups/$groupId/tasks/complete',
        data: {'taskId': taskId},
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Complete task', e);
      return null;
    }
  }

  // ==================== Prayer Tracking ====================

  /// Get daily prayer record
  Future<Map<String, dynamic>?> getDailyPrayerRecord(String date) async {
    try {
      final response = await _client.get('$_prayerTracking/$date');

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Get daily prayer record', e);
      return null;
    }
  }

  /// Update daily prayer record
  Future<Map<String, dynamic>?> updateDailyPrayerRecord(
    String date,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _client.put(
        '$_prayerTracking/$date',
        data: data,
      );

      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } on DioException catch (e) {
      _handleError('Update daily prayer record', e);
      return null;
    }
  }

  // ==================== Health Check ====================

  /// Check backend connection status
  Future<String> getConnectionStatus() async {
    try {
      final response = await _client.get('/health');

      if (response.statusCode == 200) {
        return 'connected';
      }
      return 'unavailable';
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        return 'offline';
      }
      return 'unavailable';
    }
  }

  // ==================== Error Handling ====================

  void _handleError(String operation, DioException e) {
    String message = '$operation error: ';

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        message += 'Connection timeout';
        break;
      case DioExceptionType.sendTimeout:
        message += 'Send timeout';
        break;
      case DioExceptionType.receiveTimeout:
        message += 'Receive timeout';
        break;
      case DioExceptionType.badResponse:
        message += 'Bad response (${e.response?.statusCode}): ${e.response?.data}';
        break;
      case DioExceptionType.cancel:
        message += 'Request cancelled';
        break;
      case DioExceptionType.connectionError:
        message += 'Connection error';
        break;
      default:
        message += e.message ?? 'Unknown error';
    }

    debugPrint('❌ $message');
  }
}
