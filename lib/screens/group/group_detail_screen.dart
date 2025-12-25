import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../models/group.dart';
import '../../models/task.dart';
import '../../models/user.dart';
import '../../core/network/connectivity_service.dart';
import '../text/arabic_text_viewer_screen.dart';

class GroupDetailScreen extends StatefulWidget {
  final String groupId;

  const GroupDetailScreen({Key? key, required this.groupId}) : super(key: key);

  @override
  State<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends State<GroupDetailScreen> {
  final _storageService = StorageService();
  final _apiService = ApiService();
  Group? _group;
  List<Task> _tasks = [];
  List<User> _participants = [];
  bool _isLoading = true;
  User? _currentUser;
  
  // PERFORMANCE: Pagination state for task lists with 30+ items
  static const int _tasksPerPage = 20;
  int _visibleTaskCount = 20;

  @override
  void initState() {
    super.initState();
    _loadGroupData();
  }

  Future<void> _loadGroupData({bool showLoader = true}) async {
    if (showLoader) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      _currentUser = _storageService.currentUser;

      // Check if user is logged in
      final token = await _storageService.getAuthToken();
      if (_currentUser == null || token == null) {
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

      // PERFORMANCE: Skip API call if offline - use local storage directly
      final connectivity = ConnectivityService.instance;

      if (connectivity.isOnline) {
        // Try backend API first
        try {
          final apiGroup = await _apiService.getGroupDetails(widget.groupId);
          final apiTasks = await _apiService.getGroupTasks(widget.groupId);

          if (apiGroup != null && apiTasks != null && mounted) {
            // Convert API response to local models
            final groupData = apiGroup['data'] ?? apiGroup;
            final tasksData = apiTasks;

            final group = Group(
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
              participantIds: List<String>.from(groupData['participantIds'] ?? []),
            );

            final tasks = tasksData.map<Task>((taskData) => Task(
              id: taskData['id'],
              groupId: taskData['groupId'],
              taskIndex: (taskData['taskIndex'] as num?)?.toInt() ?? 0,
              assignedTo: taskData['assignedTo'],
              status: taskData['status'] ?? 'available',
              assignedAt: taskData['assignedAt'] != null ? DateTime.parse(taskData['assignedAt']) : null,
              completedAt: taskData['completedAt'] != null ? DateTime.parse(taskData['completedAt']) : null,
              amount: (taskData['amount'] as num?)?.toInt(),
            )).toList();

            final participants = group.participantIds
                .map((id) => _storageService.getUserByIdSync(id))
                .where((user) => user != null)
                .cast<User>()
                .toList();

            setState(() {
              _group = group;
              _tasks = tasks;
              _participants = participants;
              _isLoading = false;
              // PERFORMANCE: Reset pagination when data is reloaded
              _visibleTaskCount = _tasksPerPage;
            });
            return;
          }
        } catch (apiError) {
          // API call failed, fall back to local storage
          print('API call failed for group details, using local storage: $apiError');
        }
      }

      // Fallback to local storage
      final group = await _storageService.getGroupById(widget.groupId);
      final tasks = await _storageService.getGroupTasks(widget.groupId);
      final participants = _storageService.getGroupParticipants(widget.groupId);

      setState(() {
        _group = group;
        _tasks = tasks;
        _participants = participants;
        _isLoading = false;
        // PERFORMANCE: Reset pagination when data is reloaded
        _visibleTaskCount = _tasksPerPage;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        String errorMessage = 'Veri yüklenirken hata: $e';

        // Check for auth errors
        if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
          errorMessage = 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.';
          // Clear invalid tokens and navigate to login
          await _storageService.clearAuthTokens();
          _apiService.clearAuthToken();
          Navigator.pushReplacementNamed(context, '/login');
          return;
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage)),
        );
      }
    }
  }

  Future<void> _assignTask(Task task) async {
    if (_currentUser == null) return;

    // Tefriciye, Yasin, Fetih, Cevsen ve 1000 İhlas için dinamik görev atama
    if (_group?.type == 'tefriciye' || _group?.type == 'yasin' || _group?.type == 'fetih' || _group?.type == 'cevsen' || _group?.type == '1000_ihlas') {
      _showDynamicTaskAssignmentDialog();
      return;
    }

    // Optimistic UI update for hatim/cevsen tasks to avoid "refresh" feeling
    setState(() {
      final idx = _tasks.indexWhere((t) => t.id == task.id);
      if (idx != -1) {
        _tasks[idx] = _tasks[idx].copyWith(
          assignedTo: _currentUser!.id,
          status: 'assigned',
          assignedAt: DateTime.now(),
        );
      }
    });

    try {
      // Try API first, fallback to local storage
      final connectivity = ConnectivityService.instance;

      if (connectivity.isOnline) {
        try {
          final result = await _apiService.assignTask(_group!.id, task.id);
          if (result != null) {
            await _loadGroupData(showLoader: false);
            return;
          }
        } catch (apiError) {
          print('API task assignment failed, using local storage: $apiError');
        }
      }

      // Fallback to local storage
      final updatedTask = await _storageService.assignTask(task.id);
      if (updatedTask != null) {
        await _loadGroupData(showLoader: false);
        return;
      }

      // If both failed, revert by reloading silently
      await _loadGroupData(showLoader: false);
    } catch (e) {
      await _loadGroupData(showLoader: false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Görev alınırken hata: $e')),
      );
    }
  }

  void _showDynamicTaskAssignmentDialog() {
    final amountController = TextEditingController();
    final remainingCount = _getRemainingTaskCount();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${_getTaskTypeName()} Görevi Al'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Kalan ${_getTaskTypeName()} sayısı: $remainingCount',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Kaç ${_getTaskTypeName().toLowerCase()} alacaksınız?',
                border: const OutlineInputBorder(),
                hintText: 'Örn: 100',
              ),
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Not: Aldığınız görevi tamamladıktan sonra işaretlemeyi unutmayın.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amount = int.tryParse(amountController.text);
              if (amount != null && amount > 0 && amount <= remainingCount) {
                await _assignDynamicTask(amount);
                Navigator.pop(context);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Lütfen 1 ile $remainingCount arasında bir sayı girin'),
                    backgroundColor: Colors.orange,
                  ),
                );
              }
            },
            child: const Text('Görevi Al'),
          ),
        ],
      ),
    );
  }

  Future<void> _assignDynamicTask(int amount) async {
    if (_currentUser == null) return;

    try {
      final connectivity = ConnectivityService.instance;

      if (connectivity.isOnline) {
        try {
          final result = await _apiService.assignNumberedTask(widget.groupId, amount);
          if (result != null) {
            await _loadGroupData(showLoader: false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$amount ${_getTaskTypeName().toLowerCase()} göreviniz alındı!'),
                backgroundColor: Colors.green,
              ),
            );
            return;
          }
        } catch (apiError) {
          print('API numbered task assignment failed, using local storage: $apiError');
        }
      }

      final task = await _storageService.createDynamicTask(
        groupId: widget.groupId,
        userId: _currentUser!.id,
        amount: amount,
      );
      
      if (task != null) {
        await _loadGroupData(showLoader: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$amount ${_getTaskTypeName().toLowerCase()} göreviniz alındı!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Görev alınırken hata: $e')),
      );
    }
  }

  String _getTaskTypeName() {
    switch (_group?.type) {
      case 'tefriciye':
        return 'Salavat-ı Tefriciye';
      case 'yasin':
        return 'Yasin Suresi';
      case 'fetih':
        return 'Fetih Suresi';
      case 'cevsen':
        return 'Cevşen-ül Kebir';
      case '1000_ihlas':
        return 'İhlas Suresi';
      default:
        return 'Görev';
    }
  }

  void _navigateToArabicText() {
    if (_group?.type == 'tefriciye' || _group?.type == 'yasin' || _group?.type == 'fetih') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ArabicTextViewerScreen(
            textType: _group!.type,
          ),
        ),
      );
    }
  }

  int _getRemainingTaskCount() {
    if (_group == null) return 0;
    
    final completedAmount = _tasks
        .where((task) => task.status == 'completed')
        .fold(0, (sum, task) => sum + (task.amount ?? 0));
    
    final assignedAmount = _tasks
        .where((task) => task.status == 'assigned')
        .fold(0, (sum, task) => sum + (task.amount ?? 0));
    
    return _group!.targetCount - completedAmount - assignedAmount;
  }

  Future<void> _completeTask(Task task) async {
    if (_currentUser == null) return;

    try {
      // Try API first, fallback to local storage
      final connectivity = ConnectivityService.instance;

      if (connectivity.isOnline) {
        try {
          final result = await _apiService.completeTask(_group!.id, task.id);
          if (result != null) {
            await _loadGroupData(showLoader: false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${_getTaskName(task)} tamamlandı! Allah kabul etsin.'),
                backgroundColor: Colors.green,
              ),
            );
            return;
          }
        } catch (apiError) {
          print('API task completion failed, using local storage: $apiError');
        }
      }

      // Fallback to local storage
      final updatedTask = await _storageService.completeTask(task.id);
      if (updatedTask != null) {
        await _loadGroupData(showLoader: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${_getTaskName(task)} tamamlandı! Allah kabul etsin.'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Görev tamamlanırken hata: $e')),
      );
    }
  }

  String _getTaskName(Task task) {
    if (_group?.type == 'hatim') {
      return '${task.taskIndex}. Cüz';
    } else if (_group?.type == 'cevsen') {
      // Cevşen için bab aralığını göster
      final startBab = (task.taskIndex - 1) * 5 + 1;
      final endBab = task.taskIndex * 5;
      return 'Bab $startBab-$endBab';
    } else if (task.amount != null) {
      return '${task.amount} ${_getTaskTypeName().toLowerCase()}';
    } else {
      return 'Görev ${task.taskIndex}';
    }
  }

  void _shareInviteCode() {
    if (_group == null) return;
    
    final inviteText = 'Hayırhah uygulamasında "${_group!.title}" etkinliğine katılmak için davet kodunu kullanın: ${_group!.inviteCode}';
    
    Clipboard.setData(ClipboardData(text: inviteText));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Davet linki panoya kopyalandı!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _editGroupTitle() {
    if (_group == null) return;
    
    final titleController = TextEditingController(text: _group!.title);
    final descriptionController = TextEditingController(text: _group!.description);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Etkinlik Bilgilerini Düzenle'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Etkinlik Başlığı',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: 'Açıklama',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleController.text.trim().isNotEmpty) {
                await _updateGroupInfo(
                  titleController.text.trim(),
                  descriptionController.text.trim(),
                );
                Navigator.pop(context);
              }
            },
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateGroupInfo(String newTitle, String newDescription) async {
    try {
      final updatedGroup = await _storageService.updateGroupInfo(
        _group!.id,
        newTitle,
        newDescription,
      );
      if (updatedGroup != null) {
        setState(() {
          _group = updatedGroup;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Etkinlik bilgileri güncellendi!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Güncelleme hatası: $e')),
      );
    }
  }

  void _showInvitePeopleDialog() {
    final emailController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yeni Kişi Davet Et'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Arkadaşınızın email adresini girin:',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: emailController,
              decoration: const InputDecoration(
                labelText: 'Email Adresi',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue.shade700, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Davet Kodu: ${_group!.inviteCode}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.copy, color: Colors.blue.shade700),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: _group!.inviteCode));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Davet kodu kopyalandı!'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Bu kodu arkadaşınızla paylaşabilirsiniz',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final email = emailController.text.trim();
              if (email.isNotEmpty && email.contains('@')) {
                await _sendInviteEmail(email);
                Navigator.pop(context);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Geçerli bir email adresi girin'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Davet Gönder'),
          ),
        ],
      ),
    );
  }

  Future<void> _sendInviteEmail(String email) async {
    try {
      // Kullanıcının sistemde olup olmadığını kontrol et
      final existingUser = await _storageService.findUserByEmail(email);
      
      if (existingUser != null) {
        // Kullanıcı sistemde var, otomatik olarak gruba ekle
        final success = await _storageService.addUserToGroup(_group!.id, existingUser.id);
        if (success) {
          await _loadGroupData();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${existingUser.username} etkinliğe eklendi!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        // Kullanıcı sistemde yok, email daveti simüle et
        _simulateEmailInvite(email);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Davet gönderilirken hata: $e')),
      );
    }
  }

  void _simulateEmailInvite(String email) {
    final inviteMessage = '''
Merhaba!

${_currentUser?.username} sizi "${_group!.title}" etkinliğine davet ediyor.

Katılmak için:
1. Hayırhah uygulamasını indirin
2. Hesap oluşturun ($email ile)
3. Davet kodu: ${_group!.inviteCode}

Etkinlik detayları:
${_group!.description}

Hayırlı olsun!
''';

    // Simüle edilmiş email gönderimi
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Davet Gönderildi'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.email_outlined, size: 48, color: Colors.green),
            const SizedBox(height: 16),
            Text('$email adresine davet maili gönderildi.'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                inviteMessage,
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Tamam'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_group == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Etkinlik Bulunamadı')),
        body: const Center(
          child: Text('Etkinlik bulunamadı veya erişim yetkiniz yok.'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_group!.title),
        actions: [
          if (_group!.creatorId == _currentUser?.id)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: _editGroupTitle,
            ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: _shareInviteCode,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadGroupData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              _buildProgressSection(),
              const SizedBox(height: 24),
              _buildTasksSection(),
              const SizedBox(height: 24),
              _buildParticipantsSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _group!.title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_group!.description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                _group!.description,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade100,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    'Davet Kodu: ${_group!.inviteCode}',
                    style: TextStyle(
                      color: Colors.blue.shade700,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                if (_group!.deadline != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      'Son: ${StorageService.formatDateTurkish(_group!.deadline!)}',
                      style: TextStyle(
                        color: Colors.orange.shade700,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressSection() {
    final completedAmount = _getCompletedAmount();
    final assignedAmount = _getAssignedAmount();
    final remainingCount = _group!.targetCount - completedAmount - assignedAmount;
    final progress = _group!.targetCount > 0 
        ? (completedAmount / _group!.targetCount) * 100 
        : 0.0;

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: progress == 100 
              ? [Colors.green.shade100, Colors.green.shade50]
              : [Theme.of(context).primaryColor.withOpacity(0.1), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                Icon(
                  progress == 100 ? Icons.celebration : Icons.trending_up,
                  color: progress == 100 ? Colors.green.shade700 : Theme.of(context).primaryColor,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'Genel İlerleme',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: progress == 100 ? Colors.green.shade700 : Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${progress.toStringAsFixed(0)}%',
                        style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: progress == 100 ? Colors.green.shade700 : Theme.of(context).primaryColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$completedAmount / ${_group!.targetCount} tamamlandı',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Atanan: $assignedAmount • Kalan: $remainingCount',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey[500],
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 8,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: FractionallySizedBox(
                          alignment: Alignment.centerLeft,
                          widthFactor: progress / 100,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: progress == 100 
                                    ? [Colors.green.shade400, Colors.green.shade600]
                                    : [Theme.of(context).primaryColor.withOpacity(0.7), Theme.of(context).primaryColor],
                              ),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.2),
                        spreadRadius: 2,
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: CircularProgressIndicator(
                          value: progress / 100,
                          strokeWidth: 6,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(
                            progress == 100 ? Colors.green.shade600 : Theme.of(context).primaryColor,
                          ),
                        ),
                      ),
                      Positioned.fill(
                        child: Center(
                          child: Icon(
                            progress == 100 ? Icons.check_circle : Icons.timeline,
                            color: progress == 100 ? Colors.green.shade600 : Theme.of(context).primaryColor,
                            size: 32,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (progress == 100) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade600,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.3),
                      spreadRadius: 1,
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.celebration, color: Colors.white, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Maşallah! Etkinlik başarıyla tamamlandı!\nAllah kabul etsin.',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTasksSection() {
    // Determine section title based on group type
    String sectionTitle;
    if (_group!.type == 'hatim') {
      sectionTitle = 'Cüzler';
    } else if (_group!.type == 'cevsen') {
      sectionTitle = 'Bablar';
    } else {
      sectionTitle = 'Görevler';
    }

    print('Building tasks section for type: ${_group!.type}, tasks count: ${_tasks.length}');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          sectionTitle,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        if (_group!.type == 'hatim')
          _buildHatimGrid()
        else if (_group!.type == 'cevsen')
          _buildCevsenGrid()
        else if (_group!.type == 'tefriciye' || _group!.type == 'fetih' || _group!.type == 'yasin' || _group!.type == '1000_ihlas')
          _buildNumberedTasksView()
        else
          _buildTasksList(),
      ],
    );
  }

  Widget _buildHatimGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 6,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _tasks.length,
      // PERFORMANCE: cacheExtent keeps nearby items in memory for smoother scrolling
      cacheExtent: 200,
      itemBuilder: (context, index) {
        final task = _tasks[index];
        // PERFORMANCE: ValueKey enables efficient widget diffing when task status changes
        return KeyedSubtree(
          key: ValueKey(task.id),
          child: _buildCuzCard(task),
        );
      },
    );
  }

  /// Cevşen-ül Kebir için 20 bab grubu gösteren grid (her biri 5 bab)
  Widget _buildCevsenGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1.5,
      ),
      itemCount: _tasks.length,
      cacheExtent: 200,
      itemBuilder: (context, index) {
        final task = _tasks[index];
        return KeyedSubtree(
          key: ValueKey(task.id),
          child: _buildBabCard(task),
        );
      },
    );
  }

  /// Cevşen bab kartı - 5'erli gruplar halinde gösterir (1-5, 6-10, vb.)
  Widget _buildBabCard(Task task) {
    final startBab = (task.taskIndex - 1) * 5 + 1;
    final endBab = task.taskIndex * 5;
    final babRange = '$startBab-$endBab';

    Color backgroundColor;
    Color textColor;
    Widget? icon;
    bool isClickable = false;

    switch (task.status) {
      case 'available':
        backgroundColor = Colors.teal.shade100;
        textColor = Colors.teal.shade700;
        isClickable = true;
        break;
      case 'assigned':
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        if (task.assignedTo == _currentUser?.id) {
          icon = Icon(Icons.check, color: Colors.orange.shade700, size: 14);
          isClickable = true;
        } else {
          final assignedUser = _storageService.getUserByIdSync(task.assignedTo!);
          icon = Text(
            assignedUser?.username.substring(0, 1).toUpperCase() ?? '?',
            style: TextStyle(
              color: Colors.orange.shade700,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          );
        }
        break;
      case 'completed':
        backgroundColor = Theme.of(context).brightness == Brightness.dark 
            ? Colors.grey.shade700 
            : Colors.grey.shade300;
        textColor = Theme.of(context).brightness == Brightness.dark 
            ? Colors.grey.shade300 
            : Colors.grey.shade700;
        icon = Icon(Icons.check_circle, color: Colors.green.shade600, size: 14);
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
    }

    return GestureDetector(
      onTap: isClickable ? () => _handleTaskTap(task) : null,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: task.assignedTo == _currentUser?.id 
                ? Colors.blue.shade400 
                : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              icon,
              const SizedBox(height: 2),
            ],
            Text(
              babRange,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCuzCard(Task task) {
    Color backgroundColor;
    Color textColor;
    Widget? icon;
    bool isClickable = false;

    switch (task.status) {
      case 'available':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        isClickable = true;
        break;
      case 'assigned':
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        if (task.assignedTo == _currentUser?.id) {
          icon = const Icon(Icons.check, color: Colors.white, size: 16);
          isClickable = true;
        } else {
          final assignedUser = _storageService.getUserByIdSync(task.assignedTo!);
          icon = CircleAvatar(
            radius: 12,
            backgroundColor: Colors.orange.shade700,
            child: Text(
              assignedUser?.username.substring(0, 1).toUpperCase() ?? '?',
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
          );
        }
        break;
      case 'completed':
        backgroundColor = Theme.of(context).brightness == Brightness.dark 
            ? Colors.grey.shade700 
            : Colors.grey.shade300;
        textColor = Theme.of(context).brightness == Brightness.dark 
            ? Colors.grey.shade300 
            : Colors.grey.shade700;
        icon = Icon(Icons.check_circle, color: Colors.green.shade700, size: 16);
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
    }

    return GestureDetector(
      onTap: isClickable ? () => _handleTaskTap(task) : null,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: task.assignedTo == _currentUser?.id 
                ? Colors.blue.shade300 
                : Colors.transparent,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) icon,
            Text(
              task.taskIndex.toString(),
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNumberedTasksView() {
    return Column(
      children: [
        // Kalan görev sayısını göster
        Card(
          color: Theme.of(context).brightness == Brightness.dark
              ? Colors.blue.shade900.withOpacity(0.3)
              : Colors.blue.shade50,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: Theme.of(context).brightness == Brightness.dark
                      ? Colors.blue.shade200
                      : Colors.blue.shade700,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Kalan ${_getTaskTypeName().toLowerCase()}: ${_getRemainingTaskCount()}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.blue.shade100
                          : Colors.blue.shade800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        // Görev al butonu
        if (_getRemainingTaskCount() > 0)
          Card(
            child: ListTile(
              leading: const Icon(Icons.add_task, color: Colors.green),
              title: Text('Yeni ${_getTaskTypeName()} Görevi Al'),
              subtitle: Text('Kendinize ${_getTaskTypeName().toLowerCase()} görevi atayın'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () => _showDynamicTaskAssignmentDialog(),
            ),
          ),

        // Arapça metin okuma butonu (sadece desteklenen türler için)
        if (_group?.type == 'tefriciye' || _group?.type == 'yasin' || _group?.type == 'fetih')
          Card(
            child: ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF667EEA).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.menu_book,
                  color: Color(0xFF667EEA),
                ),
              ),
              title: Text('${_getTaskTypeName()} Oku'),
              subtitle: Text('Arapça metnini okuyun'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () => _navigateToArabicText(),
            ),
          ),
        const SizedBox(height: 16),

        // Mevcut görevler
        if (_tasks.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Alınan Görevler (${_tasks.length})',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ..._tasks.map((task) {
            return KeyedSubtree(
              key: ValueKey(task.id),
              child: Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(_getTaskName(task)),
                  subtitle: Text(_getTaskStatusText(task)),
                  trailing: _getTaskTrailing(task),
                  onTap: () => _handleTaskTap(task),
                ),
              ),
            );
          }).toList(),
        ],
      ],
    );
  }

  Widget _buildTasksList() {
    // Tefriciye, Yasin, Fetih, 1000 İhlas için özel gösterim (Cevsen artık grid kullanıyor)
    if (_group?.type == 'tefriciye' || _group?.type == 'yasin' || _group?.type == 'fetih' || _group?.type == '1000_ihlas') {
      return Column(
        children: [
          // Kalan görev sayısını göster - Renk kontrastı iyileştirildi
          Card(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.blue.shade900.withOpacity(0.3)
                : Colors.blue.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.blue.shade200
                        : Colors.blue.shade700,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Kalan ${_getTaskTypeName().toLowerCase()}: ${_getRemainingTaskCount()}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).brightness == Brightness.dark
                            ? Colors.blue.shade100
                            : Colors.blue.shade800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          // Görev al butonu
          if (_getRemainingTaskCount() > 0)
            Card(
              child: ListTile(
                leading: const Icon(Icons.add_task, color: Colors.green),
                title: Text('Yeni ${_getTaskTypeName()} Görevi Al'),
                subtitle: Text('Kendinize ${_getTaskTypeName().toLowerCase()} görevi atayın'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () => _showDynamicTaskAssignmentDialog(),
              ),
            ),
          
          // Arapça metin okuma butonu (sadece desteklenen türler için)
          if (_group?.type == 'tefriciye' || _group?.type == 'yasin' || _group?.type == 'fetih')
            Card(
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF667EEA).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.menu_book,
                    color: Color(0xFF667EEA),
                  ),
                ),
                title: Text('${_getTaskTypeName()} Oku'),
                subtitle: Text('Arapça metnini okuyun'),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () => _navigateToArabicText(),
              ),
            ),
          const SizedBox(height: 16),
          // Mevcut görevler - PERFORMANCE: Pagination for 30+ items
          if (_tasks.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Alınan Görevler (${_tasks.length})',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (_tasks.length > _tasksPerPage)
                  Text(
                    'Gösterilen: ${_visibleTaskCount.clamp(0, _tasks.length)}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            // PERFORMANCE: Using ValueKey for efficient list item updates
            // Only show _visibleTaskCount tasks (pagination)
            ..._tasks.take(_visibleTaskCount).map((task) {
              return KeyedSubtree(
                key: ValueKey(task.id),
                child: Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(_getTaskName(task)),
                    subtitle: Text(_getTaskStatusText(task)),
                    trailing: _getTaskTrailing(task),
                    onTap: () => _handleTaskTap(task),
                  ),
                ),
              );
            }).toList(),
            // "Load More" button for pagination
            if (_tasks.length > _visibleTaskCount) ...[
              const SizedBox(height: 8),
              Center(
                child: ElevatedButton.icon(
                  onPressed: () {
                    setState(() {
                      _visibleTaskCount += _tasksPerPage;
                    });
                  },
                  icon: const Icon(Icons.expand_more),
                  label: Text('Daha Fazla Göster (${_tasks.length - _visibleTaskCount} kalan)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                    foregroundColor: Theme.of(context).primaryColor,
                  ),
                ),
              ),
            ],
          ],
        ],
      );
    }

    // Hatim için normal liste - PERFORMANCE: Pagination for 30+ items
    // PERFORMANCE: Using ValueKey for efficient list item updates
    return Column(
      children: [
        if (_tasks.length > _tasksPerPage)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Gösterilen: ${_visibleTaskCount.clamp(0, _tasks.length)} / ${_tasks.length}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        // Only show _visibleTaskCount tasks (pagination)
        ..._tasks.take(_visibleTaskCount).map((task) {
          return KeyedSubtree(
            key: ValueKey(task.id),
            child: Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(_getTaskName(task)),
                subtitle: Text(_getTaskStatusText(task)),
                trailing: _getTaskTrailing(task),
                onTap: () => _handleTaskTap(task),
              ),
            ),
          );
        }).toList(),
        // "Load More" button for pagination
        if (_tasks.length > _visibleTaskCount) ...[
          const SizedBox(height: 8),
          Center(
            child: ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _visibleTaskCount += _tasksPerPage;
                });
              },
              icon: const Icon(Icons.expand_more),
              label: Text('Daha Fazla Göster (${_tasks.length - _visibleTaskCount} kalan)'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                foregroundColor: Theme.of(context).primaryColor,
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _getTaskStatusText(Task task) {
    switch (task.status) {
      case 'available':
        return 'Müsait';
      case 'assigned':
        if (task.assignedTo == _currentUser?.id) {
          return 'Sizin göreviniz';
        } else {
          final assignedUser = _storageService.getUserByIdSync(task.assignedTo!);
          return '${assignedUser?.username ?? 'Bilinmeyen'} tarafından alındı';
        }
      case 'completed':
        return 'Tamamlandı';
      default:
        return 'Bilinmeyen durum';
    }
  }

  Widget? _getTaskTrailing(Task task) {
    switch (task.status) {
      case 'available':
        return const Icon(Icons.radio_button_unchecked, color: Colors.green);
      case 'assigned':
        if (task.assignedTo == _currentUser?.id) {
          return const Icon(Icons.check_circle_outline, color: Colors.blue);
        } else {
          return const Icon(Icons.person, color: Colors.orange);
        }
      case 'completed':
        return const Icon(Icons.check_circle, color: Colors.green);
      default:
        return null;
    }
  }

  void _handleTaskTap(Task task) {
    if (task.status == 'available') {
      _showAssignTaskDialog(task);
    } else if (task.status == 'assigned' && task.assignedTo == _currentUser?.id) {
      _showCompleteTaskDialog(task);
    }
  }

  void _showAssignTaskDialog(Task task) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${_getTaskName(task)} Al'),
        content: Text('${_getTaskName(task)} almak istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _assignTask(task);
            },
            child: const Text('Evet, Al'),
          ),
        ],
      ),
    );
  }

  void _showCompleteTaskDialog(Task task) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${_getTaskName(task)} Tamamlandı mı?'),
        content: const Text('Bu görevi tamamladığınızı onaylıyor musunuz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _completeTask(task);
            },
            child: const Text('Tamamla'),
          ),
        ],
      ),
    );
  }

  Widget _buildParticipantsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Katılımcılar (${_participants.length})',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            if (_group!.creatorId == _currentUser?.id)
              ElevatedButton.icon(
                onPressed: _showInvitePeopleDialog,
                icon: const Icon(Icons.person_add, size: 18),
                label: const Text('Yeni Kişi Ekle'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              // PERFORMANCE: Using ValueKey for efficient participant list updates
              children: _participants.map((participant) {
                final userTasks = _tasks.where((t) => t.assignedTo == participant.id).toList();
                final completedTasks = userTasks.where((t) => t.status == 'completed').length;
                final assignedTasks = userTasks.where((t) => t.status == 'assigned').length;

                return KeyedSubtree(
                  key: ValueKey(participant.id),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Theme.of(context).primaryColor,
                          child: Text(
                            participant.username.substring(0, 1).toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                participant.username,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'Tamamlanan: $completedTasks, Devam eden: $assignedTasks',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (participant.id == _group!.creatorId)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade100,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Oluşturan',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.purple.shade700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  int _getCompletedAmount() {
    if (_group?.type == 'hatim') {
      return _tasks.where((task) => task.status == 'completed').length;
    } else {
      return _tasks
          .where((task) => task.status == 'completed')
          .fold(0, (sum, task) => sum + (task.amount ?? 0));
    }
  }

  int _getAssignedAmount() {
    if (_group?.type == 'hatim') {
      return _tasks.where((task) => task.status == 'assigned').length;
    } else {
      return _tasks
          .where((task) => task.status == 'assigned')
          .fold(0, (sum, task) => sum + (task.amount ?? 0));
    }
  }
}