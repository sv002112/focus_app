import 'dart:async';
import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: const Home(),
    );
  }
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  int total = 1500;
  int current = 1500;
  Timer? timer;
  bool running = false;
  String category = "Work";

  void start() {
    if (running) return;
    running = true;
    timer = Timer.periodic(const Duration(seconds: 1), (t) async {
      if (current > 0) {
        setState(() => current--);
      } else {
        await saveSession();
        t.cancel();
        running = false;
      }
    });
  }

  void pause() {
    timer?.cancel();
    running = false;
  }

  void reset() {
    timer?.cancel();
    setState(() {
      current = total;
      running = false;
    });
  }

  Future<void> saveSession() async {
    final prefs = await SharedPreferences.getInstance();
    int prev = prefs.getInt("time_$category") ?? 0;
    await prefs.setInt("time_$category", prev + total);
  }

  @override
  Widget build(BuildContext context) {
    double percent = current / total;

    return Scaffold(
      appBar: AppBar(title: const Text("FocusZen")),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          DropdownButton<String>(
            value: category,
            items: ["Work","Study","Fitness"]
                .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                .toList(),
            onChanged: (v) => setState(() => category = v!),
          ),
          CircularPercentIndicator(
            radius: 130,
            lineWidth: 10,
            percent: percent,
            center: Text(
              "${current ~/ 60}:${(current % 60).toString().padLeft(2, '0')}",
              style: const TextStyle(fontSize: 30),
            ),
          ),
          const SizedBox(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(onPressed: start, child: const Text("Start")),
              const SizedBox(width: 10),
              ElevatedButton(onPressed: pause, child: const Text("Pause")),
              const SizedBox(width: 10),
              ElevatedButton(onPressed: reset, child: const Text("Reset")),
            ],
          )
        ],
      ),
    );
  }
}
