import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../models/group.dart';
import '../../core/network/connectivity_service.dart';
import 'group_detail_screen.dart';
import 'create_group_screen.dart';
import '../invite/join_group_screen.dart';

class MyGroupsScreen extends StatefulWidget {
  const MyGroupsScreen({Key? key}) : super(key: key);

  @override
  State<MyGroupsScreen> createState() => _MyGroupsScreenState();
}

class _MyGroupsScreenState extends State<MyGroupsScreen> {
  final _storageService = StorageService();
  final _apiService = ApiService();
  List<Group> _groups = [];
  List<Group> _filteredGroups = [];
  bool _isLoading = true;
  String? _selectedTypeFilter; // null = tümü

  // Etkinlik türleri
  final Map<String, String> _typeNames = {
    'hatim': 'Hatim',
    'tefriciye': 'Tefriciye',
    'fetih': 'Fetih',
    'yasin': 'Yasin',
    'cevsen': 'Cevşen',
    '1000_ihlas': '1000 İhlas',
  };

  @override
  void initState() {
    super.initState();
    _loadUserGroups();
  }

  // Kalan gün hesapla
  int? _getRemainingDays(Group group) {
    if (group.deadline == null) return null;
    final now = DateTime.now();
    final deadline = group.deadline!;
    final difference = deadline.difference(DateTime(now.year, now.month, now.day)).inDays;
    return difference;
  }

  // Etkinlikleri filtrele ve sırala
  void _applyFilterAndSort() {
    List<Group> filtered = _groups;
    
    // Türe göre filtrele
    if (_selectedTypeFilter != null) {
      filtered = filtered.where((g) => g.type == _selectedTypeFilter).toList();
    }
    
    // Kalan güne göre sırala (en az kalan önce, null deadline'lar sona)
    filtered.sort((a, b) {
      final daysA = _getRemainingDays(a);
      final daysB = _getRemainingDays(b);
      
      // Deadline olmayanlar sona
      if (daysA == null && daysB == null) return 0;
      if (daysA == null) return 1;
      if (daysB == null) return -1;
      
      return daysA.compareTo(daysB);
    });
    
    setState(() {
      _filteredGroups = filtered;
    });
  }

  Future<void> _loadUserGroups() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Set auth token for API calls
      final token = await _storageService.getAuthToken();
      if (token != null) {
        _apiService.setAuthToken(token);
      }

      // PERFORMANCE: Skip API call if offline - use local storage directly
      final connectivity = ConnectivityService.instance;
      
      if (connectivity.isOnline) {
        // Try backend API first (with short timeout due to Dio config)
        final apiGroups = await _apiService.getUserGroups();
        if (apiGroups != null) {
          // Convert API response to Group objects
          final List<Group> groups = apiGroups.map<Group>((groupData) => Group(
            id: groupData['id'],
            title: groupData['title'],
            description: groupData['description'] ?? '',
            creatorId: groupData['creatorId'] ?? '',
            type: groupData['type'],
            targetCount: groupData['targetCount'],
            currentProgress: groupData['currentProgress'] ?? 0,
            isPrivate: groupData['isPrivate'] ?? false,
            deadline: groupData['deadline'] != null ? DateTime.parse(groupData['deadline']) : null,
            inviteCode: groupData['inviteCode'],
            isActive: groupData['isActive'] ?? true,
            createdAt: DateTime.parse(groupData['createdAt']),
            participantIds: () {
              if (groupData['participantIds'] != null) {
                return List<String>.from(groupData['participantIds']);
              }
              final members = (groupData['members'] as List?) ?? const [];
              final ids = members.map<String?>((m) {
                if (m is Map) {
                  final userId = m['userId'];
                  if (userId != null) return userId.toString();
                  final user = m['user'];
                  if (user is Map && user['id'] != null) return user['id'].toString();
                }
                return null;
              }).whereType<String>().toList();
              if (ids.isNotEmpty) return ids;
              if (groupData['creatorId'] != null && groupData['creatorId'].toString().isNotEmpty) {
                return [groupData['creatorId'].toString()];
              }
              return <String>[];
            }(),
          )).toList();
          
          setState(() {
            _groups = groups;
            _isLoading = false;
          });
          _applyFilterAndSort();
          return;
        }
      }
      
      // Fallback to local storage (fast path)
      final groups = await _storageService.getUserGroups();
      setState(() {
        _groups = groups;
        _isLoading = false;
      });
      _applyFilterAndSort();
    } catch (e) {
        print('API call failed for user groups: $e');

        // Check for auth errors
        if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.'),
                backgroundColor: Colors.red,
              ),
            );
            // Clear invalid tokens and navigate to login
            await _storageService.clearAuthTokens();
            _apiService.clearAuthToken();
            Navigator.pushReplacementNamed(context, '/login');
            return;
          }
        }

      // Fallback to local storage on error
      try {
        final groups = await _storageService.getUserGroups();
        setState(() {
          _groups = groups;
          _isLoading = false;
        });
        _applyFilterAndSort();
      } catch (localError) {
        setState(() {
          _isLoading = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Etkinlikler yüklenirken hata: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text(
          'Etkinliklerim',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 1,
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Etkinliğe Katıl',
            icon: const Icon(Icons.group_add),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const JoinGroupScreen()),
              );
              _loadUserGroups();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadUserGroups,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _groups.isEmpty
                ? _buildEmptyState()
                : Column(
                    children: [
                      _buildFilterChips(),
                      Expanded(child: _buildGroupsList()),
                    ],
                  ),
      ),
      // Show floating action button only when there are groups
      floatingActionButton: _groups.isNotEmpty ? FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreateGroupScreen()),
          );
          // If a group was created, refresh the list
          if (result == true) {
            _loadUserGroups();
          }
        },
        backgroundColor: const Color(0xFF48BB78),
        child: const Icon(Icons.add, color: Colors.white),
        tooltip: 'Yeni Etkinlik Oluştur',
      ) : null,
    );
  }

  Widget _buildFilterChips() {
    // Mevcut etkinlik türlerini bul
    final availableTypes = _groups.map((g) => g.type).toSet().toList();
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Tümü chip'i
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: const Text('Tümü'),
                selected: _selectedTypeFilter == null,
                onSelected: (selected) {
                  setState(() {
                    _selectedTypeFilter = null;
                  });
                  _applyFilterAndSort();
                },
                selectedColor: Theme.of(context).primaryColor.withAlpha(50),
                checkmarkColor: Theme.of(context).primaryColor,
              ),
            ),
            // Etkinlik türü chip'leri
            ...availableTypes.map((type) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                avatar: Icon(
                  _getTypeIcon(type),
                  size: 18,
                  color: _selectedTypeFilter == type ? Colors.white : _getTypeColor(type),
                ),
                label: Text(_typeNames[type] ?? type),
                selected: _selectedTypeFilter == type,
                onSelected: (selected) {
                  setState(() {
                    _selectedTypeFilter = selected ? type : null;
                  });
                  _applyFilterAndSort();
                },
                selectedColor: _getTypeColor(type),
                labelStyle: TextStyle(
                  color: _selectedTypeFilter == type ? Colors.white : null,
                ),
                checkmarkColor: Colors.white,
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.group_off,
              size: 80,
              color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'Henüz Etkinliğiniz Yok',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).textTheme.headlineSmall?.color,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Yeni bir etkinlik oluşturun veya mevcut bir etkinliğe katılın.',
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CreateGroupScreen()),
                );
                // If a group was created, refresh the list
                if (result == true) {
                  _loadUserGroups();
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Etkinlik Oluştur'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF48BB78),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const JoinGroupScreen()),
                );
                _loadUserGroups();
              },
              icon: const Icon(Icons.group_add),
              label: const Text('Etkinliğe Katıl'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Theme.of(context).primaryColor,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                side: BorderSide(color: Theme.of(context).primaryColor.withOpacity(0.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGroupsList() {
    if (_filteredGroups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.filter_list_off, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Bu filtreye uygun etkinlik yok',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedTypeFilter = null;
                });
                _applyFilterAndSort();
              },
              child: const Text('Filtreyi Temizle'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filteredGroups.length,
      // PERFORMANCE: cacheExtent improves scroll performance for long lists
      cacheExtent: 300,
      itemBuilder: (context, index) {
        final group = _filteredGroups[index];
        // PERFORMANCE: ValueKey enables efficient widget diffing
        return KeyedSubtree(
          key: ValueKey(group.id),
          child: _buildGroupCard(group),
        );
      },
    );
  }

  Widget _buildGroupCard(Group group) {
    final isCreator = group.creatorId == _storageService.currentUser?.id;
    final progress = group.targetCount > 0 
        ? (group.currentProgress / group.targetCount) * 100 
        : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => GroupDetailScreen(groupId: group.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _getTypeColor(group.type).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _getTypeIcon(group.type),
                      color: _getTypeColor(group.type),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          group.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2D3748),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (isCreator)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.purple.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'Oluşturan',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.purple.shade700,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            if (isCreator) const SizedBox(width: 8),
                            Text(
                              '${group.participantIds.length} katılımcı',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    color: Colors.grey[400],
                    size: 16,
                  ),
                ],
              ),
              
              if (group.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  group.description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              
              const SizedBox(height: 16),
              
              // Progress
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'İlerleme',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '${group.currentProgress}/${group.targetCount}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: progress / 100,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getTypeColor(group.type),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${progress.toStringAsFixed(1)}% tamamlandı',
                    style: TextStyle(
                      fontSize: 10,
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                  ),
                ],
              ),
              
              if (group.deadline != null) ...[
                const SizedBox(height: 12),
                _buildRemainingDaysWidget(group),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRemainingDaysWidget(Group group) {
    final remainingDays = _getRemainingDays(group);
    if (remainingDays == null) return const SizedBox.shrink();
    
    Color color;
    IconData icon;
    String text;
    
    if (remainingDays < 0) {
      // Süresi geçmiş
      color = Colors.red;
      icon = Icons.warning;
      text = '${remainingDays.abs()} gün gecikmiş';
    } else if (remainingDays == 0) {
      // Bugün son gün
      color = Colors.red;
      icon = Icons.alarm;
      text = 'Bugün son gün!';
    } else if (remainingDays <= 3) {
      // 3 gün veya daha az
      color = Colors.orange;
      icon = Icons.schedule;
      text = '$remainingDays gün kaldı';
    } else if (remainingDays <= 7) {
      // 1 hafta veya daha az
      color = Colors.amber.shade700;
      icon = Icons.schedule;
      text = '$remainingDays gün kaldı';
    } else {
      // 1 haftadan fazla
      color = Colors.green;
      icon = Icons.schedule;
      text = '$remainingDays gün kaldı';
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(100)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'hatim':
        return const Color(0xFF48BB78);
      case 'tefriciye':
        return const Color(0xFFE53E3E);
      case 'fetih':
        return const Color(0xFFD69E2E);
      case 'yasin':
        return const Color(0xFF805AD5);
      case 'cevsen':
        return const Color(0xFF38B2AC);
      case '1000_ihlas':
        return const Color(0xFFED8936);
      default:
        return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'hatim':
        return Icons.auto_stories;
      case 'tefriciye':
        return Icons.volunteer_activism;
      case 'fetih':
        return Icons.star_border;
      case 'yasin':
        return Icons.wb_sunny;
      case 'cevsen':
        return Icons.shield;
      case '1000_ihlas':
        return Icons.favorite;
      default:
        return Icons.group;
    }
  }
} 