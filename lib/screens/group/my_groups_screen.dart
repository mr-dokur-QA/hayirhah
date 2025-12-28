import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../models/group.dart';
import '../../core/network/connectivity_service.dart';
import 'group_detail_screen.dart';
import 'create_group_screen.dart';
import '../invite/join_group_screen.dart';

enum _GroupsStatusTab { ongoing, completed }

enum _GroupsSortOption { remainingDays, newest, title }

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
  _GroupsStatusTab _statusTab = _GroupsStatusTab.ongoing;
  _GroupsSortOption _ongoingSort = _GroupsSortOption.remainingDays;
  _GroupsSortOption _completedSort = _GroupsSortOption.newest;

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

  bool _isGroupCompleted(Group group) {
    if (group.targetCount <= 0) return false;
    return group.currentProgress >= group.targetCount;
  }

  double _getProgressPercent(Group group) {
    if (group.targetCount <= 0) return 0.0;
    final raw = (group.currentProgress / group.targetCount) * 100;
    if (raw.isNaN || raw.isInfinite) return 0.0;
    return raw.clamp(0.0, 100.0);
  }

  // Etkinlikleri filtrele ve sırala
  void _applyFilterAndSort() {
    List<Group> filtered = _groups;
    
    // Duruma göre filtrele (Devam Eden / Tamamlanan)
    filtered = filtered.where((g) {
      final isCompleted = _isGroupCompleted(g);
      if (_statusTab == _GroupsStatusTab.completed) return isCompleted;
      return !isCompleted;
    }).toList();

    // Türe göre filtrele
    if (_selectedTypeFilter != null) {
      filtered = filtered.where((g) => g.type == _selectedTypeFilter).toList();
    }

    final sort = _statusTab == _GroupsStatusTab.completed ? _completedSort : _ongoingSort;
    switch (sort) {
      case _GroupsSortOption.remainingDays:
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
        break;
      case _GroupsSortOption.newest:
        filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case _GroupsSortOption.title:
        filtered.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
        break;
    }
    
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
    final bgColor = Theme.of(context).brightness == Brightness.dark
        ? Theme.of(context).scaffoldBackgroundColor
        : const Color(0xFFF7F7F9);

    return Scaffold(
      backgroundColor: bgColor,
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
            tooltip: 'Sırala / Filtrele',
            icon: const Icon(Icons.tune),
            onPressed: _showSortAndFilterSheet,
          ),
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
                      _buildStatusTabs(),
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

  Widget _buildStatusTabs() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: SegmentedButton<_GroupsStatusTab>(
        showSelectedIcon: false,
        segments: const [
          ButtonSegment<_GroupsStatusTab>(
            value: _GroupsStatusTab.ongoing,
            label: Text('Devam Eden'),
          ),
          ButtonSegment<_GroupsStatusTab>(
            value: _GroupsStatusTab.completed,
            label: Text('Tamamlanan'),
          ),
        ],
        selected: <_GroupsStatusTab>{_statusTab},
        onSelectionChanged: (selection) {
          final next = selection.first;
          if (next == _statusTab) return;
          setState(() {
            _statusTab = next;
          });
          _applyFilterAndSort();
        },
        style: ButtonStyle(
          visualDensity: VisualDensity.compact,
          backgroundColor: WidgetStateProperty.resolveWith<Color?>((states) {
            if (states.contains(WidgetState.selected)) {
              return Theme.of(context).colorScheme.primary.withOpacity(0.12);
            }
            return Theme.of(context).colorScheme.surface;
          }),
          side: WidgetStateProperty.resolveWith<BorderSide?>((states) {
            if (states.contains(WidgetState.selected)) {
              return BorderSide(color: Theme.of(context).colorScheme.primary.withOpacity(0.35));
            }
            return BorderSide(color: Theme.of(context).dividerColor.withOpacity(0.8));
          }),
        ),
      ),
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
                showCheckmark: false,
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
                showCheckmark: false,
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
              _statusTab == _GroupsStatusTab.completed
                  ? 'Tamamlanan etkinlik bulunamadı'
                  : 'Devam eden etkinlik bulunamadı',
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
    final progressPercent = _getProgressPercent(group);
    final isCompleted = _isGroupCompleted(group);
    final remainingDays = _getRemainingDays(group);
    final isOverdue = remainingDays != null && remainingDays < 0;
    final isDueToday = remainingDays != null && remainingDays == 0;

    final typeColor = _getTypeColor(group.type);
    final titleColor = Theme.of(context).textTheme.titleMedium?.color;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      elevation: 1,
      color: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => GroupDetailScreen(groupId: group.id),
            ),
          );
        },
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // En üstte tür
                        _buildTypeChip(group.type),
                        const SizedBox(height: 6),
                        // Altına başlık
                        Text(
                          group.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: titleColor,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            if (isCreator) ...[
                              _buildSmallChip(
                                label: 'Oluşturan',
                                bgColor: Colors.purple.withOpacity(0.12),
                                fgColor: Colors.purple.shade700,
                              ),
                              const SizedBox(width: 8),
                            ],
                            Expanded(
                              child: Text(
                                '${group.participantIds.length} katılımcı',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7),
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      _buildStatusBadge(isCompleted: isCompleted),
                      if (isOverdue || isDueToday) ...[
                        const SizedBox(height: 8),
                        Icon(
                          Icons.alarm,
                          size: 18,
                          color: isOverdue ? Colors.red.shade600 : Colors.orange.shade700,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              
              if (group.description.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  group.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.75),
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              
              const SizedBox(height: 10),
              _buildCompactProgressRow(
                typeColor: typeColor,
                progressPercent: progressPercent,
                current: group.currentProgress,
                target: group.targetCount,
                isCompleted: isCompleted,
              ),
              
              if (group.deadline != null) ...[
                const SizedBox(height: 10),
                _buildRemainingDaysWidget(group),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type) {
    final color = _getTypeColor(type);
    final label = _typeNames[type] ?? type;
    return _buildSmallChip(
      label: label,
      bgColor: color.withOpacity(0.12),
      fgColor: color,
      leading: Icon(_getTypeIcon(type), size: 14, color: color),
    );
  }

  Widget _buildSmallChip({
    required String label,
    required Color bgColor,
    required Color fgColor,
    Widget? leading,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: fgColor.withOpacity(0.18)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[
            leading,
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: fgColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge({required bool isCompleted}) {
    final bg = isCompleted ? Colors.green.withOpacity(0.14) : Colors.blue.withOpacity(0.14);
    final fg = isCompleted ? Colors.green.shade700 : Colors.blue.shade700;
    final label = isCompleted ? 'Tamamlandı' : 'Devam';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: fg.withOpacity(0.22)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(isCompleted ? Icons.check_circle : Icons.play_circle, size: 16, color: fg),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactProgressRow({
    required Color typeColor,
    required double progressPercent,
    required int current,
    required int target,
    required bool isCompleted,
  }) {
    final barBg = Theme.of(context).brightness == Brightness.dark
        ? Colors.white.withOpacity(0.12)
        : Colors.black.withOpacity(0.06);

    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: (progressPercent / 100).clamp(0.0, 1.0),
              minHeight: 8,
              backgroundColor: barBg,
              valueColor: AlwaysStoppedAnimation<Color>(
                isCompleted ? Colors.green.shade600 : typeColor,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          '${progressPercent.toStringAsFixed(0)}%',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.85),
              ),
        ),
        const SizedBox(width: 10),
        Text(
          '$current/$target',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.75),
              ),
        ),
      ],
    );
  }

  void _showSortAndFilterSheet() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        final sort = _statusTab == _GroupsStatusTab.completed ? _completedSort : _ongoingSort;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Sırala',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                RadioListTile<_GroupsSortOption>(
                  value: _GroupsSortOption.remainingDays,
                  groupValue: sort,
                  title: const Text('Kalan güne göre'),
                  subtitle: const Text('Deadline olanlar önce gelir'),
                  onChanged: (_statusTab == _GroupsStatusTab.completed)
                      ? null
                      : (v) {
                          if (v == null) return;
                          setState(() => _ongoingSort = v);
                          _applyFilterAndSort();
                          Navigator.pop(context);
                        },
                ),
                RadioListTile<_GroupsSortOption>(
                  value: _GroupsSortOption.newest,
                  groupValue: sort,
                  title: const Text('En yeni'),
                  subtitle: const Text('Oluşturulma tarihine göre'),
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() {
                      if (_statusTab == _GroupsStatusTab.completed) {
                        _completedSort = v;
                      } else {
                        _ongoingSort = v;
                      }
                    });
                    _applyFilterAndSort();
                    Navigator.pop(context);
                  },
                ),
                RadioListTile<_GroupsSortOption>(
                  value: _GroupsSortOption.title,
                  groupValue: sort,
                  title: const Text('Başlığa göre'),
                  onChanged: (v) {
                    if (v == null) return;
                    setState(() {
                      if (_statusTab == _GroupsStatusTab.completed) {
                        _completedSort = v;
                      } else {
                        _ongoingSort = v;
                      }
                    });
                    _applyFilterAndSort();
                    Navigator.pop(context);
                  },
                ),
                const Divider(height: 24),
                if (_selectedTypeFilter != null)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.clear),
                      label: const Text('Tür filtresini temizle'),
                      onPressed: () {
                        setState(() => _selectedTypeFilter = null);
                        _applyFilterAndSort();
                        Navigator.pop(context);
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
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
      icon = Icons.alarm;
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