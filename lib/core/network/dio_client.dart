import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Dio HTTP client with interceptors for logging, error handling, and retry logic
class DioClient {
  static DioClient? _instance;
  late Dio _dio;
  String? _authToken;

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

  // Base configuration - shorter timeouts when backend is not available
  static BaseOptions get _baseOptions => BaseOptions(
        baseUrl: 'http://localhost:3000/api',
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
        // Handle 401 Unauthorized - Token expired
        if (error.response?.statusCode == 401) {
          // TODO: Implement token refresh logic here when backend is ready
          debugPrint('🔐 Token expired or unauthorized');
        }
        return handler.next(error);
      },
    ));

    // Retry interceptor
    _dio.interceptors.add(_RetryInterceptor(dio: _dio));
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

