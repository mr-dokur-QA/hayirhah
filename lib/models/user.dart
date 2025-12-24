class User {
  final String id;
  final String username;
  final String email;
  final String? profilePhotoUrl;
  final DateTime createdAt;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.profilePhotoUrl,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'profilePhotoUrl': profilePhotoUrl,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] ?? '',
      username: map['username'] ?? '',
      email: map['email'] ?? '',
      profilePhotoUrl: map['profilePhotoUrl'],
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
} 