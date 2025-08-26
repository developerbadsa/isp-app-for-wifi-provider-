
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../../src/store';                 // adjust if your store path differs
import { lightTheme, darkTheme } from '../../src/utils/theme.ts'; // adjust paths if needed
import { Header } from '../../src/components/Header';          // optional, you already have this
import { Card } from '../../src/components/Card';              // optional, for small stat cards

const ACCENT = '#e50914'; // red accent (Fast.com vibe)
const BIG = 72;

const PING_URL = 'https://www.google.com/generate_204'; // tiny 204 response
// Cloudflare’s test endpoint that returns N random bytes. Adjust size to fit your needs.
const DOWNLOAD_URL = 'https://speed.cloudflare.com/__down?bytes=25000000'; // ~25 MB

const formatMbps = (v: number) => (isFinite(v) ? v.toFixed(v < 10 ? 2 : 1) : '0.0');

export default function SpeedTestScreen() {
  const { theme, language } = useAppStore();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  const [isTesting, setIsTesting] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [finalMbps, setFinalMbps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animated big number
  const animated = useRef(new Animated.Value(0)).current;
  const animateTo = useCallback((to: number, dur = 350) => {
    Animated.timing(animated, {
      toValue: to,
      duration: dur,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animated]);

  const displayedText = useRef('0.0');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = animated.addListener(({ value }) => {
      displayedText.current = formatMbps(value);
      setTick(v => v + 1); // force re-render for Animated value
    });
    return () => animated.removeListener(id);
  }, [animated]);

  // Keep a handle to the download so we can cancel
  const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);
  const stopFlag = useRef(false);

  const measurePing = useCallback(async (tries = 5) => {
    const samples: number[] = [];
    for (let i = 0; i < tries; i++) {
      const start = Date.now();
      try {
        // a small GET; HEAD is not guaranteed in all places
        await fetch(`${PING_URL}?t=${Date.now()}`, { method: 'GET' });
        samples.push(Date.now() - start);
      } catch {
        // ignore failed sample
      }
    }
    if (!samples.length) throw new Error('Ping failed');
    // median for stability
    const sorted = samples.sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)];
    return med;
  }, []);

  const startDownloadTest = useCallback(async () => {
    const dest = FileSystem.cacheDirectory! + `speedtest_${Date.now()}.bin`;
    let startTime = Date.now();
    let bytesSoFar = 0;

    stopFlag.current = false;

    const dl = FileSystem.createDownloadResumable(
      `${DOWNLOAD_URL}&r=${Date.now()}`, // bust cache
      dest,
      {},
      (progress) => {
        if (stopFlag.current) return;
        const now = Date.now();
        bytesSoFar = progress.totalBytesWritten;

        const seconds = Math.max((now - startTime) / 1000, 0.001);
        const mbit = (bytesSoFar * 8) / 1e6;     // Mbits downloaded
        const mbps = mbit / seconds;             // Mbps
        // Smooth animate toward current reading
        animateTo(mbps, 250);
      }
    );

    downloadRef.current = dl;
    try {
      // Hard stop after N seconds to avoid wasting data
      const MAX_SECONDS = 12;
      const timeout = setTimeout(() => {
        stopFlag.current = true;
      }, MAX_SECONDS * 1000);

      const result = await dl.downloadAsync();   // resolves on completion or if server closes
      clearTimeout(timeout);

      // Final reading
      const end = Date.now();
      const seconds = Math.max((end - startTime) / 1000, 0.001);
      const mbit = (bytesSoFar * 8) / 1e6;
      const mbps = mbit / seconds;

      await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
      return mbps;
    } catch (e: any) {
      // If we manually stopped, compute final up to that point
      if (stopFlag.current) {
        const end = Date.now();
        const seconds = Math.max((end - startTime) / 1000, 0.001);
        const mbit = (bytesSoFar * 8) / 1e6;
        const mbps = mbit / seconds;
        await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
        return mbps;
      }
      await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
      throw e;
    }
  }, [animateTo]);

  const startTest = useCallback(async () => {
    if (isTesting) return;
    setError(null);
    setFinalMbps(null);
    setPingMs(null);
    animateTo(0, 150);
    setIsTesting(true);

    try {
      // 1) Ping (HTTP RTT)
      const ping = await measurePing();
      setPingMs(ping);

      // 2) Download speed
      const mbps = await startDownloadTest();
      setFinalMbps(mbps);
      animateTo(mbps, 600);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong during the test.');
    } finally {
      setIsTesting(false);
      stopFlag.current = true;
      // ensure download handle is cleared
      downloadRef.current = null;
    }
  }, [animateTo, isTesting, measurePing, startDownloadTest]);

  const stopTest = useCallback(async () => {
    if (!isTesting) return;
    stopFlag.current = true;
    try {
      await downloadRef.current?.pauseAsync().catch(() => {});
    } catch {}
    setIsTesting(false);
  }, [isTesting]);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopFlag.current = true;
      downloadRef.current?.pauseAsync().catch(() => {});
    };
  }, []);

  const mainTextColor = useMemo(() => ({ color: ACCENT }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.colors.background }]}>
      <Header title="Speed Test" />
      <View style={styles.center}>
        <Animated.Text style={[styles.big, mainTextColor]}>
          {displayedText.current}
        </Animated.Text>
        <Text style={styles.unit}>Mbps</Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Ping</Text>
            <Text style={styles.statValue}>
              {pingMs !== null ? `${Math.round(pingMs)} ms` : '—'}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Upload</Text>
            <Text style={styles.statValue}>Coming soon</Text>
          </Card>
        </View>

        {error ? <Text style={[styles.error]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: ACCENT, opacity: isTesting ? 0.9 : 1 }]}
          onPress={isTesting ? stopTest : startTest}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{isTesting ? 'Stop' : 'Start Test'}</Text>
        </TouchableOpacity>

        <Text style={styles.subtle}>
          {isTesting ? 'Testing…' : finalMbps ? 'Test complete' : 'Ready'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  big: { fontSize: BIG, fontWeight: '800', letterSpacing: 0.5 },
  unit: { marginTop: 4, fontSize: 18, color: '#333' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  statCard: { padding: 14, minWidth: 140, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  button: {
    marginTop: 28,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 999,
    shadowColor: ACCENT,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtle: { marginTop: 12, color: '#666' },
  error: { marginTop: 14, color: '#d00', textAlign: 'center' },
});
