import 'package:flutter/material.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:math' as math;

class QiblaFinderScreen extends StatefulWidget {
  const QiblaFinderScreen({Key? key}) : super(key: key);

  @override
  State<QiblaFinderScreen> createState() => _QiblaFinderScreenState();
}

class _QiblaFinderScreenState extends State<QiblaFinderScreen>
    with TickerProviderStateMixin {
  double? _heading;
  double? _qiblaDirection;

  String? _cityName;
  bool _isLoading = true;
  String _statusMessage = 'Konum alınıyor...';
  bool _hasLocationPermission = false;
  
  late AnimationController _pulseController;
  late AnimationController _rotationController;
  late Animation<double> _pulseAnimation;
  
  // Kabe'nin koordinatları
  static const double kaabaLat = 21.4225;
  static const double kaabaLng = 39.8262;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    _rotationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _initializeQiblaFinder();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  Future<void> _initializeQiblaFinder() async {
    await _requestPermissions();
    if (_hasLocationPermission) {
      await _getCurrentLocation();
      _startCompass();
    }
  }

  Future<void> _requestPermissions() async {
    // Konum izni
    final locationStatus = await Permission.location.request();
    
    if (locationStatus.isGranted) {
      _hasLocationPermission = true;
    } else {
      setState(() {
        _statusMessage = 'Konum izni gerekli';
        _isLoading = false;
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _statusMessage = 'Konum servisi kapalı';
          _isLoading = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _statusMessage = 'Konum izni reddedildi';
            _isLoading = false;
          });
          return;
        }
      }

      // PERFORMANCE: Use low accuracy first for faster response (network-based)
      // This is sufficient for Qibla direction calculation
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 5),
      );

      // Şehir bilgisini al
      await _getCityName(position);

      setState(() {
        _qiblaDirection = _calculateQiblaDirection(position);
        _statusMessage = 'Kıble yönü hesaplandı';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Konum alınamadı: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _getCityName(Position position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        setState(() {
          _cityName = '${place.locality ?? place.administrativeArea ?? 'Bilinmeyen Şehir'}, ${place.country ?? ''}';
        });
      }
    } catch (e) {
      setState(() {
        _cityName = 'Şehir bilgisi alınamadı';
      });
    }
  }

  void _startCompass() {
    FlutterCompass.events?.listen((CompassEvent event) {
      setState(() {
        _heading = event.heading;
      });
    });
  }

  double _calculateQiblaDirection(Position position) {
    double lat1 = _degreesToRadians(position.latitude);
    double lng1 = _degreesToRadians(position.longitude);
    double lat2 = _degreesToRadians(kaabaLat);
    double lng2 = _degreesToRadians(kaabaLng);

    double dLng = lng2 - lng1;

    double y = math.sin(dLng) * math.cos(lat2);
    double x = math.cos(lat1) * math.sin(lat2) - 
               math.sin(lat1) * math.cos(lat2) * math.cos(dLng);

    double bearing = math.atan2(y, x);
    bearing = _radiansToDegrees(bearing);
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  double _degreesToRadians(double degrees) {
    return degrees * (math.pi / 180);
  }

  double _radiansToDegrees(double radians) {
    return radians * (180 / math.pi);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F23),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text(
          'Kıble Bulucu',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.white,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.black.withOpacity(0.3),
                Colors.transparent,
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.center,
            radius: 1.8,
            colors: [
              Color(0xFF2D3748),
              Color(0xFF1A202C),
              Color(0xFF0F1419),
            ],
          ),
        ),
        child: _isLoading
            ? _buildLoadingWidget()
            : _hasLocationPermission
                ? _buildCompassWidget()
                : _buildPermissionWidget(),
      ),
    );
  }

  Widget _buildLoadingWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF00D4AA).withOpacity(0.8),
                        const Color(0xFF00D4AA).withOpacity(0.2),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF00D4AA).withOpacity(0.3),
                        spreadRadius: 5,
                        blurRadius: 20,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.navigation,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 32),
          Text(
            _statusMessage,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.orange.withOpacity(0.3),
                    Colors.orange.withOpacity(0.1),
                  ],
                ),
                border: Border.all(
                  color: Colors.orange.withOpacity(0.5),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.location_off_outlined,
                size: 60,
                color: Colors.orange,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Konum İzni Gerekli',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _statusMessage,
              style: const TextStyle(
                color: Colors.white60,
                fontSize: 16,
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            _buildGlassButton(
              onPressed: _initializeQiblaFinder,
              label: 'Tekrar Dene',
              icon: Icons.refresh,
              color: Colors.orange,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompassWidget() {
    if (_heading == null || _qiblaDirection == null) {
      return const Center(
        child: Text(
          'Pusula kalibre ediliyor...',
          style: TextStyle(
            color: Colors.white70,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      );
    }

    double qiblaAngle = _qiblaDirection! - _heading!;
    qiblaAngle = (qiblaAngle + 360) % 360;

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 24),
        child: Column(
          children: [
            // Konum bilgisi kartı - küçültülmüş
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withOpacity(0.08),
                    Colors.white.withOpacity(0.03),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(
                  color: Colors.white.withOpacity(0.15),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.location_on,
                    color: Color(0xFF00D4AA),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  if (_cityName != null) 
                    Text(
                      _cityName!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    )
                  else
                    const Text(
                      'Konum alınıyor...',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Modern pusula - RepaintBoundary ile sarılı (performans optimizasyonu)
            RepaintBoundary(
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      Colors.white.withOpacity(0.1),
                      Colors.white.withOpacity(0.05),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.7, 1.0],
                  ),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.2),
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      spreadRadius: 10,
                      blurRadius: 30,
                    ),
                  ],
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Pusula yönleri - RepaintBoundary ile izole
                    RepaintBoundary(
                      child: Transform.rotate(
                        angle: _degreesToRadians(-_heading!),
                        child: _buildCompassDirections(),
                      ),
                    ),
                    
                    // Kıble yönü göstergesi - RepaintBoundary ile izole
                    RepaintBoundary(
                      child: Transform.rotate(
                        angle: _degreesToRadians(qiblaAngle),
                        child: _buildQiblaIndicator(),
                      ),
                    ),
                    
                    // Merkez
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF00D4AA),
                            const Color(0xFF00D4AA).withOpacity(0.7),
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00D4AA).withOpacity(0.5),
                            spreadRadius: 3,
                            blurRadius: 10,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Kıble bilgisi kartı
            _buildGlassCard(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              Colors.green.withOpacity(0.3),
                              Colors.green.withOpacity(0.1),
                            ],
                          ),
                        ),
                        child: const Icon(
                          Icons.explore,
                          color: Colors.green,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Kıble Yönü',
                        style: TextStyle(
                          color: Colors.green,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${_qiblaDirection!.toStringAsFixed(1)}°',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.w300,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.green.withOpacity(0.2),
                          Colors.green.withOpacity(0.1),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: Colors.green.withOpacity(0.3),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '🕌',
                          style: TextStyle(fontSize: 20),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Yeşil ok Kabe yönünü gösterir',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Yenile butonu
            _buildGlassButton(
              onPressed: _getCurrentLocation,
              label: 'Konumu Yenile',
              icon: Icons.refresh,
              color: const Color(0xFF00D4AA),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.white.withOpacity(0.1),
            Colors.white.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            spreadRadius: 5,
            blurRadius: 20,
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildGlassButton({
    required VoidCallback onPressed,
    required String label,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            color.withOpacity(0.3),
            color.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: color.withOpacity(0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            spreadRadius: 2,
            blurRadius: 15,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(25),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: Colors.white, size: 20),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCompassDirections() {
    return SizedBox(
      width: 280,
      height: 280,
      child: Stack(
        children: [
          // Kuzey
          const Positioned(
            top: 10,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'K',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      color: Colors.red,
                      blurRadius: 10,
                    ),
                  ],
                ),
              ),
            ),
          ),
          // Güney
          const Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'G',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          // Doğu
          const Positioned(
            right: 10,
            top: 0,
            bottom: 0,
            child: Center(
              child: Text(
                'D',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          // Batı
          const Positioned(
            left: 10,
            top: 0,
            bottom: 0,
            child: Center(
              child: Text(
                'B',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQiblaIndicator() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Cami - En üstte (Kıble yönünde hedef)
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.green.withOpacity(0.9),
                    Colors.green.withOpacity(0.6),
                  ],
                ),
                border: Border.all(
                  color: Colors.green,
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withOpacity(_pulseAnimation.value * 0.7),
                    spreadRadius: _pulseAnimation.value * 3,
                    blurRadius: _pulseAnimation.value * 12,
                  ),
                ],
              ),
              child: const Icon(
                Icons.mosque,
                color: Colors.white,
                size: 22,
              ),
            ),
            const SizedBox(height: 8),
            // Ok ucu - Cami'yi işaret eder
            CustomPaint(
              size: const Size(24, 24),
              painter: ArrowPainter(),
            ),
            const SizedBox(height: 6),
            // Ok gövdesi - Uzun çubuk
            Container(
              width: 4,
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.green,
                    Colors.green.withOpacity(0.4),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.green.withOpacity(0.5),
                    spreadRadius: 1,
                    blurRadius: 6,
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

// Modern ok çizer - Kıble yönünü gösteren ok ucu
class ArrowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..style = PaintingStyle.fill;

    final strokePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final centerX = size.width / 2;
    final centerY = size.height / 2;

    // Ok ucu şekli - daha büyük ve net
    final path = Path();
    path.moveTo(centerX, 3); // Üst nokta
    path.lineTo(centerX - 10, centerY + 8); // Sol alt
    path.lineTo(centerX - 4, centerY + 4); // Sol iç
    path.lineTo(centerX, size.height - 3); // Alt orta
    path.lineTo(centerX + 4, centerY + 4); // Sağ iç
    path.lineTo(centerX + 10, centerY + 8); // Sağ alt
    path.close();

    // Yeşil dolgu
    canvas.drawPath(path, paint);
    // Beyaz kontur
    canvas.drawPath(path, strokePaint);
    
    // Glow efekti
    final glowPaint = Paint()
      ..color = Colors.green.withOpacity(0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    
    canvas.drawPath(path, glowPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}