import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use localhost for development, can be changed to production URL later
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Authentication endpoints
  static const String loginEndpoint = '$baseUrl/auth/login';
  static const String profileEndpoint = '$baseUrl/auth/profile';
  
  // Group endpoints
  static const String groupsEndpoint = '$baseUrl/groups';
  static const String joinGroupEndpoint = '$baseUrl/groups/join';
  
  // Prayer tracking endpoints
  static const String prayerTrackingEndpoint = '$baseUrl/prayer-tracking';

  String? _authToken;
  
  // Set auth token
  void setAuthToken(String token) {
    _authToken = token;
  }
  
  // Get auth headers
  Map<String, String> get _authHeaders => {
    'Content-Type': 'application/json',
    if (_authToken != null) 'Authorization': 'Bearer $_authToken',
  };

  // Authentication
  Future<Map<String, dynamic>?> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(loginEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _authToken = data['data']['tokens']['accessToken'];
        return data;
      } else {
        print('Login failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Login error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await http.get(
        Uri.parse(profileEndpoint),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Get profile failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Get profile error: $e');
      return null;
    }
  }

  // Group Management
  Future<Map<String, dynamic>?> createGroup({
    required String title,
    String? description,
    required String type,
    required int targetCount,
    bool isPrivate = false,
    String? deadline,
  }) async {
    try {
      final requestBody = {
        'title': title,
        'type': type,
        'targetCount': targetCount,
        'isPrivate': isPrivate,
      };
      
      if (description != null) requestBody['description'] = description;
      if (deadline != null) requestBody['deadline'] = deadline;

      final response = await http.post(
        Uri.parse(groupsEndpoint),
        headers: _authHeaders,
        body: jsonEncode(requestBody),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('Group created successfully: ${data['data']['inviteCode']}');
        return data;
      } else {
        print('Create group failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Create group error: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>?> getUserGroups() async {
    try {
      final response = await http.get(
        Uri.parse(groupsEndpoint),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['data']);
      } else {
        print('Get user groups failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Get user groups error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> joinGroup(String inviteCode) async {
    try {
      final response = await http.post(
        Uri.parse(joinGroupEndpoint),
        headers: _authHeaders,
        body: jsonEncode({'inviteCode': inviteCode}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Join group failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Join group error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getGroupDetails(String groupId) async {
    try {
      final response = await http.get(
        Uri.parse('$groupsEndpoint/$groupId'),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Get group details failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Get group details error: $e');
      return null;
    }
  }

  Future<List<Map<String, dynamic>>?> getGroupTasks(String groupId) async {
    try {
      final response = await http.get(
        Uri.parse('$groupsEndpoint/$groupId/tasks'),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['data']);
      } else {
        print('Get group tasks failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Get group tasks error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> assignTask(String groupId, String taskId) async {
    try {
      final response = await http.post(
        Uri.parse('$groupsEndpoint/$groupId/tasks/assign'),
        headers: _authHeaders,
        body: jsonEncode({'taskId': taskId}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Assign task failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Assign task error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> completeTask(String groupId, String taskId) async {
    try {
      final response = await http.post(
        Uri.parse('$groupsEndpoint/$groupId/tasks/complete'),
        headers: _authHeaders,
        body: jsonEncode({'taskId': taskId}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Complete task failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Complete task error: $e');
      return null;
    }
  }

  // Prayer Tracking
  Future<Map<String, dynamic>?> getDailyPrayerRecord(String date) async {
    try {
      final response = await http.get(
        Uri.parse('$prayerTrackingEndpoint/$date'),
        headers: _authHeaders,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Get daily prayer record failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Get daily prayer record error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> updateDailyPrayerRecord(
    String date,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$prayerTrackingEndpoint/$date'),
        headers: _authHeaders,
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        print('Update daily prayer record failed: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Update daily prayer record error: $e');
      return null;
    }
  }

  // Check if backend is available and return appropriate mode
  Future<String> getConnectionStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        return 'connected';
      } else {
        return 'unavailable';
      }
    } catch (e) {
      print('Backend health check failed: $e');
      return 'offline';
    }
  }
} 