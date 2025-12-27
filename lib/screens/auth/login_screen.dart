import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../services/prayer_tracking_service.dart';
import '../../models/user.dart';
import '../dashboard/dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _storageService = StorageService();
  final _apiService = ApiService();
  bool _isLoading = false;
  bool _isRegisterMode = false;

  @override
  void initState() {
    super.initState();
    _loadSavedToken();
  }

  Future<void> _loadSavedToken() async {
    final token = await _storageService.getAuthToken();
    if (token != null && mounted) {
      _apiService.setAuthToken(token);
      // Check if token is still valid by trying to get profile
      try {
        final profile = await _apiService.getProfile();
        if (profile != null && mounted) {
          // Bootstrap current user in memory for the rest of the app
          final userData = profile['user'] ?? profile['data']?['user'] ?? profile;
          if (userData is Map && userData['id'] != null) {
            final user = User(
              id: userData['id'].toString(),
              username: (userData['username'] ?? 'Kullanıcı').toString(),
              email: (userData['email'] ?? '').toString(),
              profilePhotoUrl: userData['profilePhotoUrl']?.toString(),
              createdAt: DateTime.tryParse((userData['createdAt'] ?? '').toString()) ?? DateTime.now(),
            );
            _storageService.setCurrentUser(user);
            await _storageService.saveCurrentUserId(user.id);
          }
          // Sync prayer tracking data from backend (for auto-login)
          try {
            final prayerTrackingService = PrayerTrackingService();
            await prayerTrackingService.syncFromBackend();
          } catch (e) {
            debugPrint('Prayer tracking sync error (non-critical): $e');
          }
          // Token is valid, navigate to dashboard
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const DashboardScreen()),
          );
        }
      } catch (e) {
        // Token invalid, clear it
        await _storageService.clearAuthTokens();
        _apiService.clearAuthToken();
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Try backend API first
      final result = await _apiService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (result != null && mounted) {
        // Login successful - save tokens
        final tokens = result['tokens'] ?? result['data']?['tokens'];
        if (tokens != null) {
          final accessToken = tokens['accessToken'];
          final refreshToken = tokens['refreshToken'];
          if (accessToken != null) {
            await _storageService.saveAuthToken(accessToken);
            if (refreshToken != null) {
              await _storageService.saveRefreshToken(refreshToken);
            }
            final userData = result['user'] ?? result['data']?['user'];
            if (userData != null && userData['id'] != null) {
              await _storageService.saveCurrentUserId(userData['id']);
            }
          }
        }
        
        final userData = result['user'] ?? result['data']?['user'];
        final username = userData?['username'] ?? 'Kullanıcı';

        // Set current user in storage service
        if (userData != null) {
          final user = User(
            id: userData['id'],
            username: userData['username'] ?? username,
            email: userData['email'] ?? _emailController.text,
            profilePhotoUrl: userData['profilePhotoUrl'],
            createdAt: DateTime.parse(userData['createdAt'] ?? DateTime.now().toIso8601String()),
          );
          _storageService.setCurrentUser(user);
        }

        // Sync prayer tracking data from backend after successful login
        try {
          final prayerTrackingService = PrayerTrackingService();
          await prayerTrackingService.syncFromBackend();
        } catch (e) {
          debugPrint('Prayer tracking sync error (non-critical): $e');
        }

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hoşgeldiniz $username!'),
            backgroundColor: Colors.green,
          ),
        );
        return; // Exit early on success
      } else {
        // Backend login failed - show error
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('E-posta veya şifre hatalı. Lütfen tekrar deneyin.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('Login error: $e');
      if (mounted) {
        String errorMessage = 'Giriş başarısız oldu';
        
        // Try to extract error message from DioException
        if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
          errorMessage = 'E-posta veya şifre hatalı';
        } else if (e.toString().contains('Network') || e.toString().contains('timeout')) {
          errorMessage = 'İnternet bağlantınızı kontrol edin';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Register via backend API
      final result = await _apiService.register(
        email: _emailController.text.trim(),
        username: _emailController.text.trim().split('@')[0], // Use email prefix as username
        password: _passwordController.text,
      );

      if (result != null && mounted) {
        // Register successful - save tokens
        final tokens = result['tokens'] ?? result['data']?['tokens'];
        if (tokens != null) {
          final accessToken = tokens['accessToken'];
          final refreshToken = tokens['refreshToken'];
          if (accessToken != null) {
            await _storageService.saveAuthToken(accessToken);
            if (refreshToken != null) {
              await _storageService.saveRefreshToken(refreshToken);
            }
            final userData = result['user'] ?? result['data']?['user'];
            if (userData != null && userData['id'] != null) {
              await _storageService.saveCurrentUserId(userData['id']);
            }
          }
        }
        
        final userData = result['user'] ?? result['data']?['user'];
        final username = userData?['username'] ?? 'Kullanıcı';

        // Set current user in storage service
        if (userData != null) {
          final user = User(
            id: userData['id'],
            username: userData['username'] ?? username,
            email: userData['email'] ?? _emailController.text,
            profilePhotoUrl: userData['profilePhotoUrl'],
            createdAt: DateTime.parse(userData['createdAt'] ?? DateTime.now().toIso8601String()),
          );
          _storageService.setCurrentUser(user);
        }

        // Sync prayer tracking data from backend after successful registration
        try {
          final prayerTrackingService = PrayerTrackingService();
          await prayerTrackingService.syncFromBackend();
        } catch (e) {
          debugPrint('Prayer tracking sync error (non-critical): $e');
        }

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Kayıt başarılı! Hoşgeldiniz $username!'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Kayıt başarısız oldu. Lütfen tekrar deneyin.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Register error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Kayıt hatası: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // Google Sign-In disabled for now - uncomment when Firebase is configured
  // Future<void> _signInWithGoogle() async {
  //   // ... implementation
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.1),
                // Logo ve başlık
                Icon(
                  Icons.brightness_7,
                  size: 80,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(height: 24),
                Text(
                  'Hayırhah',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Birlikte okuyalım, birlikte dua edelim',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),

                // Email field
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'E-posta',
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'E-posta adresinizi girin';
                    }
                    if (!value.contains('@')) {
                      return 'Geçerli bir e-posta adresi girin';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Şifre',
                    prefixIcon: Icon(Icons.lock_outlined),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Şifrenizi girin';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Login/Register button
                ElevatedButton(
                  onPressed: _isLoading ? null : (_isRegisterMode ? _register : _login),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator()
                      : Text(_isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap'),
                ),
                const SizedBox(height: 16),

                // Toggle between login and register
                TextButton(
                  onPressed: () {
                    setState(() {
                      _isRegisterMode = !_isRegisterMode;
                    });
                  },
                  child: Text(
                    _isRegisterMode
                        ? 'Zaten hesabınız var mı? Giriş yapın'
                        : 'Hesabınız yok mu? Kayıt olun',
                    style: TextStyle(
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Google Sign-In disabled for now
                // TODO: Enable when Firebase is configured
              ],
            ),
          ),
        ),
      ),
    );
  }
} 