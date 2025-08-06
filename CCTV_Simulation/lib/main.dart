import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:urban_guard/pages/register_camera_page.dart';

void main() {
  runApp(UrbanGuardApp());
}

class UrbanGuardApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'UrbanGuard',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: RegisterCameraPage(),
    );
  }
}
