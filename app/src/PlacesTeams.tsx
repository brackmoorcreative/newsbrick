import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePrefs } from './prefs';
import { PLACE_FACETS, placeTopicId, TEAM_LEAGUES, teamTopicId, type Team } from './topics';
import { SERVICE_URL } from './useLocalTopics';
import { fonts, useStyles, useTheme, type Palette } from './theme';

const MAX_PLACES = 6;
const MAX_TEAMS = 12;

// "Your places": any city, state, or country, each with Local news / Politics / Economy.
export function PlacesSection() {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { places, topics, addPlace, removePlace, toggleTopic } = usePrefs();
  const [draft, setDraft] = useState('');
  const canAdd = draft.trim().length >= 2 && places.length < MAX_PLACES;
  const add = () => {
    if (!canAdd) return;
    addPlace(draft);
    setDraft('');
  };

  return (
    <View>
      <Text style={styles.label}>Your places</Text>
      <Text style={styles.hint}>Any city, state, or country. Follow its local news, politics, or economy.</Text>
      {!SERVICE_URL && <Text style={styles.warn}>Places need the NewsBrick service, which isn’t connected yet.</Text>}

      {places.map((name) => (
        <View key={name} style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{name}</Text>
            <Pressable onPress={() => removePlace(name)} hitSlop={10} accessibilityLabel={`Remove ${name}`}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {PLACE_FACETS.map(({ facet, label }) => {
              const id = placeTopicId(name, facet);
              const on = topics.includes(id);
              return (
                <Pressable
                  key={facet}
                  onPress={() => toggleTopic(id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${name}: ${label}`}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {on ? '✓ ' : ''}
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      {places.length < MAX_PLACES && (
        <View style={styles.addRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            placeholder="Add a place, e.g. Toronto or Kenya"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="done"
            accessibilityLabel="Add a place"
          />
          <Pressable onPress={add} disabled={!canAdd} accessibilityRole="button" style={[styles.addButton, !canAdd && styles.disabled]}>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type LeagueTeam = { id: string; name: string; logo: string | null };

// "Your teams": pick a league, search its teams, tap to follow.
export function TeamsSection() {
  const styles = useStyles(makeStyles);
  const { colors } = useTheme();
  const { teams, addTeam, removeTeam } = usePrefs();
  const [league, setLeague] = useState<(typeof TEAM_LEAGUES)[number] | null>(null);
  const [all, setAll] = useState<LeagueTeam[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // The league's teams, via the NewsBrick service (ESPN doesn't let apps read the list directly).
  useEffect(() => {
    if (!league || !SERVICE_URL) return;
    let cancelled = false;
    setStatus('loading');
    setAll([]);
    fetch(`${SERVICE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league: league.key }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { teams: LeagueTeam[] }) => {
        if (cancelled) return;
        setAll(j.teams);
        setStatus('idle');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [league]);

  const followed = new Set(teams.map(teamTopicId));
  const q = query.trim().toLowerCase();
  const matches = all
    .filter((t) => !q || t.name.toLowerCase().includes(q))
    .filter((t) => league && !followed.has(teamTopicId({ league: league.key, id: t.id })))
    .slice(0, q ? 8 : 6);

  return (
    <View>
      <Text style={styles.label}>Your teams</Text>
      {!SERVICE_URL && <Text style={styles.warn}>Teams need the NewsBrick service, which isn’t connected yet.</Text>}
      {teams.map((t) => (
        <View key={teamTopicId(t)} style={styles.teamRow}>
          {t.logo ? <Image source={{ uri: t.logo }} style={styles.logo} /> : <View style={styles.logo} />}
          <Text style={styles.teamName}>{t.name}</Text>
          <Pressable onPress={() => removeTeam(t)} hitSlop={10} accessibilityLabel={`Remove ${t.name}`}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {teams.length < MAX_TEAMS && (
        <>
          <Text style={styles.hint}>Add a team: pick a league, then search.</Text>
          <View style={styles.chips}>
            {TEAM_LEAGUES.map((l) => {
              const on = league?.key === l.key;
              return (
                <Pressable key={l.key} onPress={() => setLeague(on ? null : l)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button">
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{l.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {league && (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={`Search ${league.name} teams`}
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.search]}
                accessibilityLabel={`Search ${league.name} teams`}
              />
              {status === 'loading' && <Text style={styles.hint}>Loading teams…</Text>}
              {status === 'error' && <Text style={styles.warn}>Couldn’t load teams. Check your connection.</Text>}
              {matches.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    addTeam({ league: league.key, id: t.id, name: t.name, logo: t.logo ?? undefined });
                    setQuery('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Follow ${t.name}`}
                  style={styles.teamRow}
                >
                  {t.logo ? <Image source={{ uri: t.logo }} style={styles.logo} /> : <View style={styles.logo} />}
                  <Text style={styles.teamName}>{t.name}</Text>
                  <Text style={styles.addInline}>＋ Follow</Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    label: { fontFamily: fonts.label, fontSize: 14, color: c.muted, marginTop: 28, marginBottom: 10 },
    hint: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: c.muted, marginBottom: 10 },
    warn: { fontFamily: fonts.labelMedium, fontSize: 14, color: '#C0392B', marginBottom: 10 },
    card: { borderWidth: 1, borderColor: c.hairline, borderRadius: 8, padding: 12, marginBottom: 10, gap: 10 },
    cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontFamily: fonts.headline, fontSize: 18, color: c.text },
    remove: { fontFamily: fonts.label, fontSize: 14, color: c.muted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1.5, borderColor: c.hairline, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 },
    chipOn: { backgroundColor: c.text, borderColor: c.text },
    chipText: { fontFamily: fonts.label, fontSize: 15, lineHeight: 20, color: c.text },
    chipTextOn: { color: c.background },
    addRow: { flexDirection: 'row', gap: 8 },
    input: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: c.hairline,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: fonts.body,
      fontSize: 17,
      color: c.text,
    },
    search: { flex: 0, marginTop: 12, marginBottom: 6 },
    addButton: { backgroundColor: c.text, borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
    addText: { fontFamily: fonts.label, fontSize: 16, color: c.background },
    disabled: { opacity: 0.3 },
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
    },
    logo: { width: 28, height: 28 },
    teamName: { flex: 1, fontFamily: fonts.label, fontSize: 16, color: c.text },
    addInline: { fontFamily: fonts.label, fontSize: 14, color: c.link },
  });
