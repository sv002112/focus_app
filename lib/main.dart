import 'dart:async';
import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';

void main() {
  runApp(const FocusZen());
}

class FocusZen extends StatelessWidget {
  const FocusZen({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: const TimerPage(),
    );
  }
}

class TimerPage extends StatefulWidget {
  const TimerPage({super.key});

  @override
  State<TimerPage> createState() => _TimerPageState();
}

class _TimerPageState extends State<TimerPage> {
  int totalSeconds = 1500;
  int current = 1500;
  Timer? timer;
  bool running = false;

  void start() {
    if (running) return;
    running = true;
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (current > 0) {
        setState(() => current--);
      } else {
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
      current = totalSeconds;
      running = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    double percent = current / totalSeconds;

    return Scaffold(
      appBar: AppBar(title: const Text("FocusZen")),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularPercentIndicator(
            radius: 140,
            lineWidth: 12,
            percent: percent,
            center: Text(
              "${(current ~/ 60).toString().padLeft(2, '0')}:${(current % 60).toString().padLeft(2, '0')}",
              style: const TextStyle(fontSize: 36),
            ),
          ),
          const SizedBox(height: 40),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(onPressed: start, child: const Text("Start")),
              const SizedBox(width: 10),
              ElevatedButton(onPressed: pause, child: const Text("Pause")),
              const SizedBox(width: 10),
              ElevatedButton(onPressed: reset, child: const Text("Reset")),
            ],
          ),
        ],
      ),
    );
  }
}
