import 'package:flutter/material.dart';
import 'storage_service.dart';

class ThemeService extends ChangeNotifier {
  static final ThemeService _instance = ThemeService._internal();
  factory ThemeService() => _instance;
  ThemeService._internal();

  final StorageService _storage = StorageService();
  bool _isDarkMode = false;

  bool get isDarkMode => _isDarkMode;

  // Light theme colors
  static const Color _primaryLight = Color(0xFF48BB78);
  static const Color _primaryDarkLight = Color(0xFF2F855A);
  static const Color _backgroundLight = Color(0xFFF8F9FA);
  static const Color _surfaceLight = Colors.white;
  static const Color _textLight = Color(0xFF2D3748);
  static const Color _secondaryTextLight = Color(0xFF4A5568);

  // Dark theme colors
  static const Color _primaryDark = Color(0xFF68D391);
  static const Color _primaryDarkDark = Color(0xFF48BB78);
  static const Color _backgroundDark = Color(0xFF1A202C);
  static const Color _surfaceDark = Color(0xFF2D3748);
  static const Color _textDark = Colors.white;
  static const Color _secondaryTextDark = Color(0xFFA0AEC0);

  ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: _primaryLight,
      scaffoldBackgroundColor: _backgroundLight,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primaryLight,
        brightness: Brightness.light,
        primary: _primaryLight,
        secondary: _primaryDarkLight,
        background: _backgroundLight,
        surface: _surfaceLight,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: _surfaceLight,
        foregroundColor: _textLight,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: _textLight,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardTheme(
        color: _surfaceLight,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      textTheme: TextTheme(
        headlineLarge: TextStyle(color: _textLight),
        headlineMedium: TextStyle(color: _textLight),
        headlineSmall: TextStyle(color: _textLight),
        bodyLarge: TextStyle(color: _textLight),
        bodyMedium: TextStyle(color: _secondaryTextLight),
        bodySmall: TextStyle(color: _secondaryTextLight),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryLight,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }

  ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: _primaryDark,
      scaffoldBackgroundColor: _backgroundDark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _primaryDark,
        brightness: Brightness.dark,
        primary: _primaryDark,
        secondary: _primaryDarkDark,
        background: _backgroundDark,
        surface: _surfaceDark,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: _surfaceDark,
        foregroundColor: _textDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: _textDark,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardTheme(
        color: _surfaceDark,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      textTheme: TextTheme(
        headlineLarge: TextStyle(color: _textDark),
        headlineMedium: TextStyle(color: _textDark),
        headlineSmall: TextStyle(color: _textDark),
        bodyLarge: TextStyle(color: _textDark),
        bodyMedium: TextStyle(color: _secondaryTextDark),
        bodySmall: TextStyle(color: _secondaryTextDark),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: _primaryDark,
          foregroundColor: Colors.white,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }

  Future<void> toggleTheme() async {
    _isDarkMode = !_isDarkMode;
    await _storage.saveThemePreference(_isDarkMode);
    notifyListeners();
  }

  Future<void> loadThemePreference() async {
    _isDarkMode = await _storage.getThemePreference() ?? false;
    notifyListeners();
  }

  // Helper methods for theme-aware colors
  static Color getTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark 
        ? _textDark 
        : _textLight;
  }

  static Color getSecondaryTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark 
        ? _secondaryTextDark 
        : _secondaryTextLight;
  }

  static Color getSubtleTextColor(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark 
        ? const Color(0xFF718096) // Lighter grey for dark theme
        : const Color(0xFF718096); // Same grey for light theme
  }
} 