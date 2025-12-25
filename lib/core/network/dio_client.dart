import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../services/storage_service.dart';

/// Dio HTTP client with interceptors for logging, error handling, and retry logic
class DioClient {
  static DioClient? _instance;
  late Dio _dio;
  String? _authToken;
  final StorageService _storageService = StorageService();

  // Single-flight refresh
  Future<String?>? _refreshInFlight;

  // Singleton pattern
  static DioClient get instance {
    _instance ??= DioClient._internal();
    return _instance!;
  }

  DioClient._internal() {
    _dio = Dio(_baseOptions);
    _setupInterceptors();
  }

  // Factory constructor
  factory DioClient() => instance;

  // Production API URL
  static const String _productionUrl = 'https://hayirhah-production.up.railway.app/api';
  static const String _developmentUrl = 'http://localhost:3000/api';
  
  // Set to true for production, false for local development
  static const bool isProduction = true;

  // Base configuration
  static BaseOptions get _baseOptions => BaseOptions(
        baseUrl: isProduction ? _productionUrl : _developmentUrl,
        connectTimeout: const Duration(seconds: 5), // Reduced from 15s
        receiveTimeout: const Duration(seconds: 10),
        sendTimeout: const Duration(seconds: 5),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      );

  Dio get dio => _dio;

  /// Set authentication token
  void setAuthToken(String? token) {
    _authToken = token;
    if (token != null) {
      _dio.options.headers['Authorization'] = 'Bearer $token';
    } else {
      _dio.options.headers.remove('Authorization');
    }
  }

  /// Get current auth token
  String? get authToken => _authToken;

  /// Clear authentication
  void clearAuth() {
    _authToken = null;
    _dio.options.headers.remove('Authorization');
  }

  /// Setup interceptors
  void _setupInterceptors() {
    _dio.interceptors.clear();

    // Logging interceptor (only in debug mode)
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestHeader: true,
        requestBody: true,
        responseHeader: false,
        responseBody: true,
        error: true,
        logPrint: (log) => debugPrint('🌐 DIO: $log'),
      ));
    }

    // Auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        return handler.next(response);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - try refresh flow once, then retry original request
        final statusCode = error.response?.statusCode;
        final requestOptions = error.requestOptions;
        final isRefreshCall = requestOptions.extra['isRefreshCall'] == true ||
            requestOptions.path.endsWith('/auth/refresh');
        final hasRetried = requestOptions.extra['hasRetried'] == true;

        if (statusCode == 401 && !isRefreshCall && !hasRetried) {
          try {
            final newAccessToken = await _refreshAccessToken();
            if (newAccessToken != null) {
              // Retry original request with new token
              requestOptions.extra['hasRetried'] = true;
              requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
              final clonedResponse = await _dio.fetch(requestOptions);
              return handler.resolve(clonedResponse);
            }
          } catch (e) {
            debugPrint('🔐 Refresh failed: $e');
            // Fall through to propagate 401
          }
        }

        return handler.next(error);
      },
    ));

    // Retry interceptor
    _dio.interceptors.add(_RetryInterceptor(dio: _dio));
  }

  Future<String?> _refreshAccessToken() async {
    // Single-flight: if refresh already running, await it
    if (_refreshInFlight != null) {
      return _refreshInFlight;
    }

    _refreshInFlight = () async {
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return null;
      }

      try {
        final response = await _dio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
          options: Options(
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            extra: const {'isRefreshCall': true},
          ),
        );

        final data = response.data;
        final tokens = (data is Map ? (data['tokens'] ?? data) : null);
        if (tokens is Map) {
          final accessToken = tokens['accessToken']?.toString();
          final newRefreshToken = tokens['refreshToken']?.toString();

          if (accessToken != null && accessToken.isNotEmpty) {
            await _storageService.saveAuthToken(accessToken);
            if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
              await _storageService.saveRefreshToken(newRefreshToken);
            }
            setAuthToken(accessToken);
            return accessToken;
          }
        }
      } catch (e) {
        // If refresh fails, clear tokens to force re-login later
        await _storageService.clearAuthTokens();
        clearAuth();
        rethrow;
      } finally {
        // noop
      }

      return null;
    }();

    try {
      return await _refreshInFlight;
    } finally {
      _refreshInFlight = null;
    }
  }

  /// GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }

  /// DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
    );
  }
}

/// Retry interceptor for automatic retry on network errors
class _RetryInterceptor extends Interceptor {
  final Dio dio;
  final int maxRetries;
  final Duration retryDelay;
  
  // Track if backend is available to skip retries
  static bool _backendAvailable = true;
  static DateTime? _lastFailureTime;

  _RetryInterceptor({
    required this.dio,
    this.maxRetries = 1, // Reduced from 3 - only 1 retry when backend might be down
    this.retryDelay = const Duration(milliseconds: 500), // Reduced from 1s
  });

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final retryCount = err.requestOptions.extra['retryCount'] ?? 0;

    // If backend recently failed, skip retries for 30 seconds
    if (_lastFailureTime != null) {
      final timeSinceFailure = DateTime.now().difference(_lastFailureTime!);
      if (timeSinceFailure.inSeconds < 30) {
        debugPrint('⏭️ Skipping retry - backend recently unavailable');
        return handler.next(err);
      }
    }

    // Only retry on network errors and timeouts
    if (_shouldRetry(err) && retryCount < maxRetries) {
      debugPrint('🔄 Retrying request (${retryCount + 1}/$maxRetries)...');
      
      await Future.delayed(retryDelay);

      try {
        final options = err.requestOptions;
        options.extra['retryCount'] = retryCount + 1;

        final response = await dio.fetch(options);
        _backendAvailable = true;
        _lastFailureTime = null;
        return handler.resolve(response);
      } catch (e) {
        _backendAvailable = false;
        _lastFailureTime = DateTime.now();
        return handler.next(err);
      }
    }

    // Mark backend as unavailable on connection errors
    if (err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout) {
      _backendAvailable = false;
      _lastFailureTime = DateTime.now();
    }

    return handler.next(err);
  }

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError;
  }
}

