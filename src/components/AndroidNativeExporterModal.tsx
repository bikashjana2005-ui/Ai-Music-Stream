import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Layers,
  FileCode,
  Globe
} from 'lucide-react';

interface AndroidNativeExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AndroidNativeExporterModal: React.FC<AndroidNativeExporterModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'flutter' | 'kotlin'>('install');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const liveAppUrl = window.location.origin;

  // Flutter Code Snippets preconfigured with live URL
  const flutterPubspec = `name: ai_music_stream
description: AI Music Stream Native Android WebView App

environment:
  sdk: ">=3.0.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.27.0
  firebase_auth: ^4.17.8
  google_sign_in: ^6.2.1
  webview_flutter: ^4.7.0
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`;

  const flutterMainDart = `import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AiMusicStreamApp());
}

class AiMusicStreamApp extends StatelessWidget {
  const AiMusicStreamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Music Stream',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          elevation: 0,
        ),
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF020617))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse('$liveAppUrl'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Music Stream'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Colors.indigoAccent),
            ),
        ],
      ),
    );
  }
}
`;

  const androidManifestXml = `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aimusicstream.app">

    <!-- Internet & Network Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:label="AI Music Stream"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  const kotlinMainActivity = `package com.aimusicstream.app

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(this)
        setContentView(webView)

        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = WebViewClient()
        webView.loadUrl("$liveAppUrl")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`;

  const copyText = (text: string, fileLabel: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(fileLabel);
    onShowToast(`Copied ${fileLabel} to clipboard!`, 'success');
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-indigo-500/30 text-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">Native Android & APK Converter</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                    AI Studio Feature
                  </span>
                </div>
                <p className="text-xs text-slate-400">Install as WebAPK or export Flutter / Android Studio native project code</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'install'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Download size={15} />
              1-Click WebAPK & Install
            </button>
            <button
              onClick={() => setActiveTab('flutter')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'flutter'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <Code2 size={15} />
              Flutter Native Wrapper
            </button>
            <button
              onClick={() => setActiveTab('kotlin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'kotlin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode size={15} />
              Android Studio (Kotlin)
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'install' && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 rounded-2xl">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-1">
                    <ShieldCheck size={18} /> Direct Android WebAPK Installation
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Open this live web application on your Android phone using <strong>Google Chrome</strong>. Tap the top-right menu (3 dots) and select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>. Android will build a native APK package directly on your device with app icon, splash screen, and background audio support!
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 break-all">
                    <Globe size={14} className="shrink-0 text-indigo-400" />
                    <span>{liveAppUrl}</span>
                    <button
                      onClick={() => copyText(liveAppUrl, 'Live App URL')}
                      className="ml-auto text-indigo-400 hover:text-white shrink-0 p-1"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                    <Download size={18} className="text-indigo-400" /> Convert Live URL to Downloadable .APK File
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Convert this web app into a signed Android <code>.apk</code> or Google Play Store <code>.aab</code> package instantly using PWABuilder (Trusted by Microsoft & Google):
                  </p>
                  <a
                    href={`https://www.pwabuilder.com/?url=${encodeURIComponent(liveAppUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Generate & Download APK on PWABuilder <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'flutter' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    Complete Flutter source code pre-configured with this exact live web URL and Android permissions:
                  </p>
                </div>

                {/* pubspec.yaml */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-300 font-bold">pubspec.yaml</span>
                    <button
                      onClick={() => copyText(flutterPubspec, 'pubspec.yaml')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                    >
                      {copiedFile === 'pubspec.yaml' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedFile === 'pubspec.yaml' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">{flutterPubspec}</pre>
                </div>

                {/* main.dart */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-300 font-bold">lib/main.dart</span>
                    <button
                      onClick={() => copyText(flutterMainDart, 'lib/main.dart')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                    >
                      {copiedFile === 'lib/main.dart' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedFile === 'lib/main.dart' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-52">{flutterMainDart}</pre>
                </div>

                {/* AndroidManifest.xml */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-300 font-bold">android/app/src/main/AndroidManifest.xml</span>
                    <button
                      onClick={() => copyText(androidManifestXml, 'AndroidManifest.xml')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                    >
                      {copiedFile === 'AndroidManifest.xml' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedFile === 'AndroidManifest.xml' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">{androidManifestXml}</pre>
                </div>
              </div>
            )}

            {activeTab === 'kotlin' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Native Android Studio Kotlin code for generating a lightweight native APK WebView app:
                </p>

                {/* Kotlin MainActivity.kt */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-300 font-bold">MainActivity.kt</span>
                    <button
                      onClick={() => copyText(kotlinMainActivity, 'MainActivity.kt')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                    >
                      {copiedFile === 'MainActivity.kt' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedFile === 'MainActivity.kt' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">{kotlinMainActivity}</pre>
                </div>

                {/* AndroidManifest.xml */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-300 font-bold">AndroidManifest.xml</span>
                    <button
                      onClick={() => copyText(androidManifestXml, 'AndroidManifest.xml')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-sans"
                    >
                      {copiedFile === 'AndroidManifest.xml' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedFile === 'AndroidManifest.xml' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">{androidManifestXml}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
