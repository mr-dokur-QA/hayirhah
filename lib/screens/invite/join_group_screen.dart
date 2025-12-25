import 'package:flutter/material.dart';
import '../../services/storage_service.dart';
import '../../services/api_service.dart';
import '../../core/network/connectivity_service.dart';
import '../group/group_detail_screen.dart';

class JoinGroupScreen extends StatefulWidget {
  const JoinGroupScreen({Key? key}) : super(key: key);

  @override
  State<JoinGroupScreen> createState() => _JoinGroupScreenState();
}

class _JoinGroupScreenState extends State<JoinGroupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _inviteCodeController = TextEditingController();
  final _storageService = StorageService();
  final _apiService = ApiService();
  bool _isLoading = false;

  @override
  void dispose() {
    _inviteCodeController.dispose();
    super.dispose();
  }

  Future<void> _joinGroup() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final inviteCode = _inviteCodeController.text.trim().toUpperCase();

      // Prefer backend when online
      final connectivity = ConnectivityService.instance;
      if (connectivity.isOnline) {
        final token = await _storageService.getAuthToken();
        if (token != null) {
          _apiService.setAuthToken(token);
        }

        final result = await _apiService.joinGroup(inviteCode);
        if (result != null) {
          final groupData = result['data'] ?? result;
          final groupId = groupData['id'];
          if (groupId != null && mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => GroupDetailScreen(groupId: groupId)),
            );
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${groupData['title'] ?? 'Etkinlik'} etkinliğine katıldınız!'),
                backgroundColor: Colors.green,
              ),
            );
            return;
          }
        }
      }

      // Fallback to local storage (offline / API fail)
      final group = await _storageService.joinGroupByInviteCode(inviteCode);

      if (group != null && mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => GroupDetailScreen(groupId: group.id),
          ),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${group.title} etkinliğine katıldınız!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Katılım hatası: $e'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Etkinliğe Katıl'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.group_add,
                size: 80,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 24),
              Text(
                'Davet Kodu ile Katıl',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Size verilen 6 haneli davet kodunu girin',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),

              TextFormField(
                controller: _inviteCodeController,
                decoration: const InputDecoration(
                  labelText: 'Davet Kodu',
                  hintText: 'Örnek: ABC123',
                  prefixIcon: Icon(Icons.vpn_key),
                  border: OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Davet kodunu girin';
                  }
              final len = value.trim().length;
              if (len != 6 && len != 10) {
                return 'Davet kodu 6 veya 10 haneli olmalıdır';
                  }
                  return null;
                },
                onChanged: (value) {
                  // Otomatik büyük harfe çevir
                  if (value.length <= 6) {
                    final upperValue = value.toUpperCase();
                    if (upperValue != value) {
                      _inviteCodeController.value = _inviteCodeController.value.copyWith(
                        text: upperValue,
                        selection: TextSelection.collapsed(offset: upperValue.length),
                      );
                    }
                  }
                },
              ),
              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _isLoading ? null : _joinGroup,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Katıl'),
              ),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue.shade700,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Davet Kodu Nedir?',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Her etkinliğin kendine özel 6 haneli bir davet kodu vardır. Bu kodu etkinlik oluşturan kişiden alabilirsiniz.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
} 