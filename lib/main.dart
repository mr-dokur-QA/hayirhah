import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'screens/auth/login_screen.dart';
import 'services/theme_service.dart';
import 'services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services in parallel for faster startup
  await Future.wait([
    initializeDateFormatting('tr_TR', null),
    StorageService.initialize(), // PERFORMANCE: Cache SharedPreferences instance
  ]);
  
  runApp(const DuaKardeslikApp());
}

class DuaKardeslikApp extends StatefulWidget {
  const DuaKardeslikApp({Key? key}) : super(key: key);

  @override
  State<DuaKardeslikApp> createState() => _DuaKardeslikAppState();
}

class _DuaKardeslikAppState extends State<DuaKardeslikApp> {
  final _themeService = ThemeService();

  @override
  void initState() {
    super.initState();
    _themeService.loadThemePreference();
    _themeService.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    _themeService.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hayırhah',
      theme: _themeService.lightTheme,
      darkTheme: _themeService.darkTheme,
      themeMode: _themeService.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      locale: const Locale('tr', 'TR'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('tr', 'TR'),
        Locale('en', 'US'),
      ],
      home: const LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
