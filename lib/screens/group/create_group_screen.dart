import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../core/network/connectivity_service.dart';

class CreateGroupScreen extends StatefulWidget {
  const CreateGroupScreen({Key? key}) : super(key: key);

  @override
  State<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends State<CreateGroupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _storageService = StorageService();
  final _apiService = ApiService();

  String? _selectedTemplate;
  bool _isPrivate = false;
  bool _isLoading = false;
  DateTime? _deadline;

  final Map<String, Map<String, dynamic>> _templates = {
    'hatim': {
      'title': 'Hatim',
      'description': 'Kur\'an-ı Kerim\'i 30 cüzde tamamlayalım',
      'icon': Icons.auto_stories, // Kur'an kitabı
      'color': const Color(0xFF48BB78),
      'count': 30,
    },
    'tefriciye': {
      'title': 'Salât-ı Tefriciye',
      'description': '4444 defa Salât-ı Tefriciye okuyalım',
      'icon': Icons.volunteer_activism, // Dua eden eller
      'color': const Color(0xFFE53E3E),
      'count': 4444,
    },
    'fetih': {
      'title': 'Fetih Suresi',
      'description': '19 defa Fetih Suresi okuyalım',
      'icon': Icons.star_border, // Zafer yıldızı
      'color': const Color(0xFFD69E2E),
      'count': 19,
    },
    'yasin': {
      'title': 'Yasin Suresi',
      'description': '41 defa Yasin Suresi okuyalım',
      'icon': Icons.wb_sunny, // Nur/ışık
      'color': const Color(0xFF805AD5),
      'count': 41,
    },
    'cevsen': {
      'title': 'Cevşen-ül Kebir',
      'description': '100 bab Cevşen-ül Kebir okuyalım',
      'icon': Icons.shield, // Koruma kalkanı
      'color': const Color(0xFF38B2AC),
      'count': 100,
    },
    '1000_ihlas': {
      'title': '1000 İhlas',
      'description': '1000 defa İhlas Suresi okuyalım',
      'icon': Icons.favorite, // Kalp
      'color': const Color(0xFFED8936),
      'count': 1000,
    },
  };

  @override
  void initState() {
    super.initState();
    _loadAuthToken();
  }

  Future<void> _loadAuthToken() async {
    final token = await _storageService.getAuthToken();
    if (token != null) {
      _apiService.setAuthToken(token);
      print('Auth token loaded successfully');
    } else {
      print('No auth token found');
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _createGroup() async {
    if (_selectedTemplate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lütfen bir etkinlik türü seçiniz'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    if (!_formKey.currentState!.validate()) return;

    // Check if user is logged in
    final currentUser = _storageService.currentUser;
    final token = await _storageService.getAuthToken();

    print('Auth check - Current user: ${currentUser?.username}, Token exists: ${token != null}');

    if (currentUser == null || token == null) {
      print('Auth failed - User not logged in');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Lütfen önce giriş yapın'),
            backgroundColor: Colors.red,
          ),
        );
        // Navigate to login screen
        Navigator.pushReplacementNamed(context, '/login');
      }
      return;
    }

    // Set auth token for API calls
    _apiService.setAuthToken(token);

    setState(() {
      _isLoading = true;
    });

    try {
      final template = _templates[_selectedTemplate]!;
      int targetCount = template['count'];
      
      // Kullanıcı boş bıraktıysa şablon değerlerini kullan
      final title = _titleController.text.trim().isEmpty 
          ? template['title'] 
          : _titleController.text.trim();
      final description = _descriptionController.text.trim().isEmpty 
          ? template['description'] 
          : _descriptionController.text.trim();

      // PERFORMANCE: Skip API if offline - use local storage directly
      final connectivity = ConnectivityService.instance;
      
      if (connectivity.isOnline) {
        // Try backend API first
        try {
          print('Creating group via API: $title, type: $_selectedTemplate');
          final result = await _apiService.createGroup(
            title: title,
            description: description,
            type: _selectedTemplate!,
            targetCount: targetCount,
            isPrivate: _isPrivate,
            // Backend expects YYYY-MM-DD
            deadline: _deadline != null ? _deadline!.toIso8601String().split('T')[0] : null,
          );
          print('API result: $result');

          if (result != null && mounted) {
            // Extract group data from response
            final groupData = result['data'] ?? result;
            final groupTitle = groupData['title'] ?? title;
            final inviteCode = groupData['inviteCode'] ?? 'N/A';
            
            Navigator.pop(context, true);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$groupTitle başarıyla oluşturuldu!\nDavet Kodu: $inviteCode'),
                backgroundColor: Colors.green,
                duration: const Duration(seconds: 4),
              ),
            );
            return;
          } else if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Grup oluşturulamadı. Lütfen tekrar deneyin.'),
                backgroundColor: Colors.red,
              ),
            );
          }
        } catch (e) {
          print('Create group error: $e');
          if (mounted) {
            String errorMessage = 'Grup oluşturulamadı';
            
            // Check DioException for specific error codes
            if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
              // With refresh-token interceptor, a 401 here is likely not recoverable
              errorMessage = 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.';
              await _storageService.clearAuthTokens();
              _apiService.clearAuthToken();
              Navigator.pushReplacementNamed(context, '/login');
              return;
            } else if (e.toString().contains('400') || e.toString().contains('Bad Request')) {
              errorMessage = 'Geçersiz grup bilgileri. Lütfen kontrol edin.';
            } else if (e.toString().contains('Network') || e.toString().contains('timeout')) {
              errorMessage = 'İnternet bağlantınızı kontrol edin';
            } else if (e.toString().contains('500')) {
              errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
            }
            
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(errorMessage),
                backgroundColor: Colors.red,
                duration: const Duration(seconds: 4),
              ),
            );
          }
        }
      }
      
      // Fallback to local storage (fast path when offline or API fails)
      if (mounted) {
        final group = await _storageService.createGroup(
          title: title,
          description: description,
          type: _selectedTemplate!,
          targetCount: targetCount,
          isPrivate: _isPrivate,
          deadline: _deadline,
        );

        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${group.title} başarıyla oluşturuldu! (Yerel)'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Etkinlik oluşturulurken hata: $e')),
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

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 7)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _deadline = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [
                    const Color(0xFF1a1a2e),
                    const Color(0xFF16213e),
                    const Color(0xFF0f3460),
                  ]
                : [
                    const Color(0xFF1e3a5f),
                    const Color(0xFF2d5a7b),
                    const Color(0xFF3d7a9e),
                  ],
          ),
        ),
        child: SafeArea(
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                // Custom App Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const Expanded(
                        child: Text(
                          'Yeni Etkinlik Oluştur',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(width: 48), // Balance for back button
                    ],
                  ),
                ),
                
                // Template selection header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.amber.withAlpha(40),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.mosque,
                              color: Colors.amber,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Etkinlik Türünü Seçin',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Birlikte okuyalım, birlikte dua edelim',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Template selection - Scrollable
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildTemplateGrid(),
                        ),

                        // Form fields - only show after template selection
                        if (_selectedTemplate != null) ...[
                          const SizedBox(height: 16),
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(25),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withAlpha(30),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.edit_note, color: Colors.white70, size: 20),
                                    SizedBox(width: 8),
                                    Text(
                                      'Etkinlik Detayları',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                
                                // Title field - etkinliğe özel placeholder
                                TextFormField(
                                  controller: _titleController,
                                  style: const TextStyle(color: Colors.white, fontSize: 16),
                                  decoration: InputDecoration(
                                    labelText: 'Etkinlik Başlığı',
                                    labelStyle: const TextStyle(color: Colors.white70),
                                    hintText: _getExampleTitle(_selectedTemplate),
                                    hintStyle: TextStyle(
                                      color: Colors.white.withAlpha(100),
                                      fontStyle: FontStyle.italic,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white.withAlpha(10),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: Colors.white.withAlpha(60)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.amber, width: 2),
                                    ),
                                    errorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.redAccent),
                                    ),
                                    focusedErrorBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.redAccent, width: 2),
                                    ),
                                    prefixIcon: const Icon(Icons.title, color: Colors.white70),
                                  ),
                                  // Boş bırakılırsa şablon değeri kullanılacak
                                  validator: (value) => null, // Boş olabilir, şablon değeri kullanılır
                                ),
                                const SizedBox(height: 16),

                                // Description field - etkinliğe özel placeholder
                                TextFormField(
                                  controller: _descriptionController,
                                  style: const TextStyle(color: Colors.white, fontSize: 16),
                                  decoration: InputDecoration(
                                    labelText: 'Açıklama (İsteğe bağlı)',
                                    labelStyle: const TextStyle(color: Colors.white70),
                                    hintText: _getExampleDescription(_selectedTemplate),
                                    hintStyle: TextStyle(
                                      color: Colors.white.withAlpha(100),
                                      fontStyle: FontStyle.italic,
                                    ),
                                    filled: true,
                                    fillColor: Colors.white.withAlpha(10),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: Colors.white.withAlpha(60)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.amber, width: 2),
                                    ),
                                    prefixIcon: const Icon(Icons.description, color: Colors.white70),
                                  ),
                                  maxLines: 2,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Settings section - Compact
                          Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(25),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.white.withAlpha(30),
                              ),
                            ),
                            child: Column(
                              children: [
                                // Privacy setting
                                SwitchListTile(
                                  title: const Text('Özel Etkinlik', style: TextStyle(color: Colors.white)),
                                  subtitle: const Text('Sadece davet linki ile katılım', style: TextStyle(color: Colors.white60, fontSize: 12)),
                                  value: _isPrivate,
                                  activeColor: Colors.amber,
                                  onChanged: (value) {
                                    setState(() {
                                      _isPrivate = value;
                                    });
                                  },
                                  secondary: Icon(
                                    _isPrivate ? Icons.lock : Icons.lock_open,
                                    color: _isPrivate ? Colors.amber : Colors.white54,
                                  ),
                                ),
                                Divider(height: 1, color: Colors.white.withAlpha(30)),
                                // Deadline setting
                                ListTile(
                                  title: const Text('Son Tarih', style: TextStyle(color: Colors.white)),
                                  subtitle: Text(
                                    _deadline != null 
                                        ? StorageService.formatDateTurkish(_deadline!)
                                        : 'Tarih seçilmedi',
                                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                                  ),
                                  leading: const Icon(Icons.calendar_today, color: Colors.white70),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (_deadline != null)
                                        IconButton(
                                          icon: const Icon(Icons.clear, size: 20, color: Colors.white54),
                                          onPressed: () {
                                            setState(() {
                                              _deadline = null;
                                            });
                                          },
                                        ),
                                      TextButton(
                                        onPressed: _selectDate,
                                        style: TextButton.styleFrom(
                                          foregroundColor: Colors.amber,
                                        ),
                                        child: const Text('Seç'),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Create button
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _createGroup,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.amber,
                                  foregroundColor: Colors.black87,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  elevation: 4,
                                ),
                                child: _isLoading
                                    ? const CircularProgressIndicator(color: Colors.black87)
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.add_circle_outline),
                                          SizedBox(width: 8),
                                          Text(
                                            'Etkinlik Oluştur',
                                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTemplateGrid() {
    // Eğer bir şablon seçildiyse sadece onu göster
    if (_selectedTemplate != null) {
      final template = _templates[_selectedTemplate]!;
      return _buildSelectedTemplateCard(_selectedTemplate!, template);
    }
    
    // Seçim yapılmadıysa tüm şablonları göster
    return Column(
      children: _templates.entries.map((entry) {
        final templateKey = entry.key;
        final template = entry.value;
        return _buildTemplateCard(templateKey, template);
      }).toList(),
    );
  }

  Widget _buildSelectedTemplateCard(String templateKey, Map<String, dynamic> template) {
    return Column(
      children: [
        // Seçili etkinlik kartı
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                template['color'].withAlpha(80),
                template['color'].withAlpha(40),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(
              color: template['color'],
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: template['color'].withAlpha(60),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              // Icon container
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      template['color'].withAlpha(200),
                      template['color'],
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: template['color'].withAlpha(100),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(
                  template['icon'],
                  size: 26,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      template['title'],
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: template['color'],
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _getShortDescription(templateKey),
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withAlpha(200),
                      ),
                    ),
                  ],
                ),
              ),
              // Count badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: template['color'],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  template['count'] > 0
                      ? '${template['count']} ${templateKey == 'hatim' ? 'Cüz' : ''}'
                      : 'Özel',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Değiştir butonu
              IconButton(
                onPressed: () {
                  setState(() {
                    _selectedTemplate = null;
                    _titleController.clear();
                    _descriptionController.clear();
                  });
                },
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.swap_horiz,
                    size: 20,
                    color: Colors.white,
                  ),
                ),
                tooltip: 'Etkinlik Değiştir',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTemplateCard(String templateKey, Map<String, dynamic> template) {
    // Her etkinlik için hafif farklı arka plan tonu
    final bgAlpha = _getBackgroundAlpha(templateKey);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTemplate = templateKey;
            // Placeholder olarak gösterilecek, controller'ı boş bırak
            _titleController.clear();
            _descriptionController.clear();
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                template['color'].withAlpha(bgAlpha),
                template['color'].withAlpha(bgAlpha ~/ 2),
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            border: Border.all(
              color: template['color'].withAlpha(60),
              width: 1,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              // Icon container
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      template['color'].withAlpha(180),
                      template['color'],
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: template['color'].withAlpha(80),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(
                  template['icon'],
                  size: 26,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      template['title'],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _getShortDescription(templateKey),
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white.withAlpha(180),
                      ),
                    ),
                  ],
                ),
              ),
              // Count badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: template['color'].withAlpha(50),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: template['color'].withAlpha(100),
                  ),
                ),
                child: Text(
                  template['count'] > 0
                      ? '${template['count']} ${templateKey == 'hatim' ? 'Cüz' : ''}'
                      : 'Özel',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: template['color'],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Arrow icon
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: template['color'].withAlpha(180),
              ),
            ],
          ),
        ),
      ),
    );
  }

  int _getBackgroundAlpha(String templateKey) {
    // Her etkinlik için farklı arka plan yoğunluğu
    switch (templateKey) {
      case 'hatim':
        return 35;
      case 'tefriciye':
        return 30;
      case 'fetih':
        return 32;
      case 'yasin':
        return 28;
      case 'cevsen':
        return 30;
      case '1000_ihlas':
        return 33;
      default:
        return 25;
    }
  }

  String _getShortDescription(String templateKey) {
    switch (templateKey) {
      case 'hatim':
        return 'Kur\'an-ı Kerim hatmi';
      case 'tefriciye':
        return 'Salavat-ı Şerife';
      case 'fetih':
        return 'Fetih Suresi okuma';
      case 'yasin':
        return 'Yasin-i Şerif okuma';
      case 'cevsen':
        return 'Cevşen-ül Kebir duası';
      case '1000_ihlas':
        return 'İhlas Suresi okuma';
      default:
        return '';
    }
  }

  // Her etkinlik için örnek başlık
  String _getExampleTitle(String? templateKey) {
    switch (templateKey) {
      case 'hatim':
        return 'Ramazan Aile Hatmi';
      case 'tefriciye':
        return 'Şifa Niyetine Tefriciye';
      case 'fetih':
        return 'Fetih Suresi Kampanyası';
      case 'yasin':
        return 'Cuma Yasin Okuma';
      case 'cevsen':
        return 'Haftalık Cevşen';
      case '1000_ihlas':
        return 'Kandil Gecesi İhlas';
      default:
        return 'Etkinlik adı girin';
    }
  }

  // Her etkinlik için örnek açıklama
  String _getExampleDescription(String? templateKey) {
    switch (templateKey) {
      case 'hatim':
        return 'Ailemizle birlikte Ramazan hatmi yapıyoruz';
      case 'tefriciye':
        return 'Hastalarımız için şifa niyetine okuyoruz';
      case 'fetih':
        return 'Zafer ve başarı için Fetih Suresi';
      case 'yasin':
        return 'Her Cuma Yasin-i Şerif okuyoruz';
      case 'cevsen':
        return 'Koruma ve bereket için Cevşen';
      case '1000_ihlas':
        return 'Kandil gecesi 1000 İhlas kampanyası';
      default:
        return 'Etkinlik açıklaması';
    }
  }
}