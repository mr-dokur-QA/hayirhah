import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';

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

    setState(() {
      _isLoading = true;
    });

    try {
      final template = _templates[_selectedTemplate]!;
      int targetCount = template['count'];

      // Try backend API first
      final result = await _apiService.createGroup(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        type: _selectedTemplate!,
        targetCount: targetCount,
        isPrivate: _isPrivate,
        deadline: _deadline?.toIso8601String(),
      );

      if (result != null && mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${result['data']['title']} başarıyla oluşturuldu!\nDavet Kodu: ${result['data']['inviteCode']}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 4),
          ),
        );
      } else if (mounted) {
        // Fallback to local storage if API fails
        final group = await _storageService.createGroup(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
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
                                
                                // Title field
                                TextFormField(
                                  controller: _titleController,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    labelText: 'Etkinlik Başlığı',
                                    labelStyle: const TextStyle(color: Colors.white70),
                                    hintText: 'Örn: Ramazan Hatmi',
                                    hintStyle: TextStyle(color: Colors.white.withAlpha(80)),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: Colors.white.withAlpha(50)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.amber),
                                    ),
                                    prefixIcon: const Icon(Icons.title, color: Colors.white70),
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Başlık giriniz';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 16),

                                // Description field
                                TextFormField(
                                  controller: _descriptionController,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    labelText: 'Açıklama (İsteğe bağlı)',
                                    labelStyle: const TextStyle(color: Colors.white70),
                                    hintText: 'Etkinlik hakkında detaylı bilgi',
                                    hintStyle: TextStyle(color: Colors.white.withAlpha(80)),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: Colors.white.withAlpha(50)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(color: Colors.amber),
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
    return Column(
      children: _templates.entries.map((entry) {
        final templateKey = entry.key;
        final template = entry.value;
        final isSelected = _selectedTemplate == templateKey;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: GestureDetector(
            onTap: () {
              setState(() {
                _selectedTemplate = templateKey;
                _titleController.text = template['title'];
                _descriptionController.text = template['description'];
              });
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isSelected
                      ? [
                          template['color'].withAlpha(60),
                          template['color'].withAlpha(30),
                        ]
                      : [
                          Colors.white.withAlpha(15),
                          Colors.white.withAlpha(8),
                        ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                border: Border.all(
                  color: isSelected 
                      ? template['color'] 
                      : Colors.white.withAlpha(25),
                  width: isSelected ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: template['color'].withAlpha(60),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
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
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? template['color'] : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _getShortDescription(templateKey),
                          style: TextStyle(
                            fontSize: 13,
                            color: isSelected 
                                ? Colors.white.withAlpha(200)
                                : Colors.white.withAlpha(150),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Count badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? template['color']
                          : Colors.white.withAlpha(20),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      template['count'] > 0
                          ? '${template['count']} ${templateKey == 'hatim' ? 'Cüz' : ''}'
                          : 'Özel',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSelected ? Colors.white : Colors.white70,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Selection indicator
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isSelected ? template['color'] : Colors.transparent,
                      border: Border.all(
                        color: isSelected ? template['color'] : Colors.white30,
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 14, color: Colors.white)
                        : null,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
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
}