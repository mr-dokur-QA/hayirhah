class Group {
  final String id;
  final String title;
  final String description;
  final String creatorId;
  final String type; // "hatim", "tefriciye", "custom_parca", "custom_sayi"
  final int targetCount;
  final int currentProgress;
  final bool isPrivate;
  final DateTime? deadline;
  final String inviteCode;
  final bool isActive;
  final DateTime createdAt;
  final List<String> participantIds;

  Group({
    required this.id,
    required this.title,
    required this.description,
    required this.creatorId,
    required this.type,
    required this.targetCount,
    this.currentProgress = 0,
    this.isPrivate = false,
    this.deadline,
    required this.inviteCode,
    this.isActive = true,
    required this.createdAt,
    this.participantIds = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'creatorId': creatorId,
      'type': type,
      'targetCount': targetCount,
      'currentProgress': currentProgress,
      'isPrivate': isPrivate,
      'deadline': deadline?.toIso8601String(),
      'inviteCode': inviteCode,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'participantIds': participantIds,
    };
  }

  factory Group.fromMap(Map<String, dynamic> map) {
    return Group(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      creatorId: map['creatorId'] ?? '',
      type: map['type'] ?? '',
      targetCount: map['targetCount']?.toInt() ?? 0,
      currentProgress: map['currentProgress']?.toInt() ?? 0,
      isPrivate: map['isPrivate'] ?? false,
      deadline: map['deadline'] != null ? DateTime.parse(map['deadline']) : null,
      inviteCode: map['inviteCode'] ?? '',
      isActive: map['isActive'] ?? true,
      createdAt: DateTime.parse(map['createdAt']),
      participantIds: List<String>.from(map['participantIds'] ?? []),
    );
  }

  Group copyWith({
    String? id,
    String? title,
    String? description,
    String? creatorId,
    String? type,
    int? targetCount,
    int? currentProgress,
    bool? isPrivate,
    DateTime? deadline,
    String? inviteCode,
    bool? isActive,
    DateTime? createdAt,
    List<String>? participantIds,
  }) {
    return Group(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      creatorId: creatorId ?? this.creatorId,
      type: type ?? this.type,
      targetCount: targetCount ?? this.targetCount,
      currentProgress: currentProgress ?? this.currentProgress,
      isPrivate: isPrivate ?? this.isPrivate,
      deadline: deadline ?? this.deadline,
      inviteCode: inviteCode ?? this.inviteCode,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      participantIds: participantIds ?? this.participantIds,
    );
  }
} 