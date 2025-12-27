import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'screens/auth/login_screen.dart';
import 'services/theme_service.dart';
import 'services/storage_service.dart';
import 'services/location_service.dart';
import 'core/network/connectivity_service.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase init (required for push notifications)
  await Firebase.initializeApp();

  // Register background handler early
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  
  // Initialize services in parallel for faster startup
  await Future.wait([
    initializeDateFormatting('tr_TR', null),
    StorageService.initialize(), // PERFORMANCE: Cache SharedPreferences instance
    ConnectivityService.instance.initialize(), // PERFORMANCE: Monitor network connectivity
  ]);

  // Notifications (foreground local notification + permission)
  await NotificationService.instance.initialize();
  
  // PERFORMANCE: Check location permission at startup (non-blocking)
  // This pre-loads location state for faster subsequent requests
  LocationService().initialize();
  
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
      routes: {
        '/login': (_) => const LoginScreen(),
      },
      home: const LoginScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
