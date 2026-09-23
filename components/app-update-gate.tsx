import { useEffect } from 'react';
import { ActivityIndicator, AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { installedVersionCode, useAppUpdate } from '@/features/app-update';
import { Button } from './ui';

export function AppUpdateGate() {
  const { check, hasChecked, policy, release, dismissedCode, phase, progress, error, permissionHelp,
    dismiss, install, cancelDownload, openPermissionSettings } = useAppUpdate();

  useEffect(() => {
    void check();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => listener.remove();
  }, [check]);

  if (!hasChecked) return <View style={s.wait}><ActivityIndicator color="#fff" /><Text style={s.waitText}>Checking app version…</Text></View>;
  if (!release || policy === 'none' || (policy === 'optional' && dismissedCode === release.latestVersionCode)) return null;

  const mandatory = policy === 'mandatory';
  const active = phase !== 'idle';
  const phaseLabel = phase === 'downloading' ? `Downloading update${progress === null ? '…' : ` · ${progress}%`}` : phase === 'verifying' ? 'Verifying update…'
    : phase === 'installing' ? 'Opening Android installer…' : 'Update Now';
  return (
    <View style={s.overlay}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>MUENOT SHOPKEEPER</Text>
        <Text style={s.title}>{mandatory ? 'Update Required' : 'New Update Available'}</Text>
        <Text style={s.body}>{mandatory
          ? 'This version of Muenot Shopkeeper is no longer supported. Update to continue.'
          : 'A newer version of Muenot Shopkeeper is ready.'}</Text>
        <Text style={s.version}>Version {release.latestVersion} · build {release.latestVersionCode}</Text>
        {!!release.releaseNotes.length && <View style={s.notes}>
          <Text style={s.notesTitle}>What’s New</Text>
          {release.releaseNotes.map((note, index) => <Text key={index} style={s.note}>• {note}</Text>)}
        </View>}
        <Button title={phaseLabel} loading={active} onPress={() => void install()} />
        {phase === 'downloading' && <Button title="Cancel Download" variant="outline" onPress={() => void cancelDownload()} />}
        {permissionHelp && <Text style={s.hint}>Android may require your permission to install apps from Muenot Shopkeeper.</Text>}
        <Button title="Installation Permission Settings" variant="outline" disabled={active} onPress={() => void openPermissionSettings()} />
        {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {phase === 'idle' && <Text style={s.hint}>Android will ask you to confirm installation. If you cancel, tap Update Now to try again. Current build: {installedVersionCode}.</Text>}
        {!mandatory && <Button title="Later" variant="outline" disabled={active} onPress={() => void dismiss()} />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wait: { ...StyleSheet.absoluteFill, zIndex: 200, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: 12 },
  waitText: { color: '#fff', fontSize: 14 },
  overlay: { ...StyleSheet.absoluteFill, zIndex: 200, backgroundColor: '#f6f8f7' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 26, gap: 17 },
  eyebrow: { color: colors.primary, fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  title: { color: colors.text, fontSize: 29, fontWeight: '800' },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  version: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  notes: { backgroundColor: '#fff', padding: 18, borderRadius: 14, gap: 9 },
  notesTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  note: { color: colors.text, fontSize: 14, lineHeight: 21 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19 },
});
