class Task {
  final String id;
  final String groupId;
  final int taskIndex; // Cüz numarası veya görev sırası
  final String? assignedTo; // Kullanıcı ID'si
  final String status; // "available", "assigned", "completed"
  final DateTime? assignedAt;
  final DateTime? completedAt;
  final int? amount; // Sayılı görevler için miktar

  Task({
    required this.id,
    required this.groupId,
    required this.taskIndex,
    this.assignedTo,
    this.status = 'available',
    this.assignedAt,
    this.completedAt,
    this.amount,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'groupId': groupId,
      'taskIndex': taskIndex,
      'assignedTo': assignedTo,
      'status': status,
      'assignedAt': assignedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'amount': amount,
    };
  }

  factory Task.fromMap(Map<String, dynamic> map) {
    return Task(
      id: map['id'] ?? '',
      groupId: map['groupId'] ?? '',
      taskIndex: map['taskIndex']?.toInt() ?? 0,
      assignedTo: map['assignedTo'],
      status: map['status'] ?? 'available',
      assignedAt: map['assignedAt'] != null ? DateTime.parse(map['assignedAt']) : null,
      completedAt: map['completedAt'] != null ? DateTime.parse(map['completedAt']) : null,
      amount: map['amount']?.toInt(),
    );
  }

  Task copyWith({
    String? id,
    String? groupId,
    int? taskIndex,
    String? assignedTo,
    String? status,
    DateTime? assignedAt,
    DateTime? completedAt,
    int? amount,
  }) {
    return Task(
      id: id ?? this.id,
      groupId: groupId ?? this.groupId,
      taskIndex: taskIndex ?? this.taskIndex,
      assignedTo: assignedTo ?? this.assignedTo,
      status: status ?? this.status,
      assignedAt: assignedAt ?? this.assignedAt,
      completedAt: completedAt ?? this.completedAt,
      amount: amount ?? this.amount,
    );
  }
} 