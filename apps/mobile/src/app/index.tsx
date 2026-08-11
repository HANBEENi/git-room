import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { fetchPublicContributions, renderRoomSVG } from '@git-room/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, MaxContentWidth } from '@/constants/theme';

export default function HomeScreen() {
  const [username, setUsername] = useState('');
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    const trimmed = username.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const { daysSinceLastCommit, currentStreak } = await fetchPublicContributions(trimmed);
      const { svg } = renderRoomSVG({ username: trimmed, daysSinceLastCommit, currentStreak });
      setSvg(svg);
    } catch {
      setError('방 상태를 불러오지 못했어요. GitHub 유저네임을 확인해주세요.');
      setSvg(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          🧹 Git-Room
        </ThemedText>
        <ThemedText type="small" style={styles.subtitle}>
          GitHub 유저네임을 입력하면 방 상태를 볼 수 있어요
        </ThemedText>

        <TextInput
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={handleCheck}
          placeholder="GitHub username"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />

        {loading && <ActivityIndicator />}
        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}
        {svg && (
          <ThemedView type="backgroundElement" style={styles.roomCard}>
            <SvgXml xml={svg} width="100%" height={220} />
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#8884',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  roomCard: {
    alignSelf: 'stretch',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    padding: Spacing.two,
  },
});
