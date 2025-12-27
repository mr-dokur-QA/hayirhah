import 'package:flutter/material.dart';

import '../screens/group/group_detail_screen.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

Future<void> openGroupDetailFromNotification(String groupId) async {
  final nav = appNavigatorKey.currentState;
  if (nav == null) return;

  nav.push(
    MaterialPageRoute(
      builder: (_) => GroupDetailScreen(groupId: groupId),
    ),
  );
}


