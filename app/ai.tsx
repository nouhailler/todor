import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../store/taskStore';
import { Colors, Radius, Space, FontFamily } from '../constants/tokens';

const AI_SUGGESTIONS = [
  "Qu'est-ce qu'il me manque pour une raclette ?",
  'Combien de temps pour cuire des lentilles ?',
  "Génère mes tâches à partir d'un texte",
  'Répartis les courses entre nous',
];

const AI_ANSWERS: Record<string, { text: string; add: string[] | null }> = {
  "Qu'est-ce qu'il me manque pour une raclette ?": {
    text: "Pour une raclette à 4, il te manque le fromage et la charcuterie — le reste est déjà sur ta liste. Voici ce que j'ajouterais :",
    add: ['Fromage à raclette (1,2 kg)', 'Assortiment charcuterie', 'Pommes de terre (1 kg)', 'Cornichons'],
  },
  'Combien de temps pour cuire des lentilles ?': {
    text: "Les lentilles vertes cuisent en 20 à 25 min dans 3 fois leur volume d'eau froide non salée. Sale en fin de cuisson pour qu'elles restent fondantes.",
    add: null,
  },
  "Génère mes tâches à partir d'un texte": {
    text: "Bien sûr — colle le texte ou le JSON généré par Claude dans Réglages › Import, et je crée toutes les tâches d'un coup avec leurs priorités et échéances.",
    add: null,
  },
  'Répartis les courses entre nous': {
    text: "J'ai réparti les articles restants pour limiter les allers-retours : Marc prend le rayon frais, Léa les fruits & légumes, et toi l'épicerie.",
    add: null,
  },
};

const DEFAULT_ANSWER = {
  text: "Bonne question ! Je peux compléter une liste, estimer des quantités, répartir les tâches, ou générer des tâches depuis un texte. Dis-m'en un peu plus.",
  add: null,
};

interface Msg {
  who: 'me' | 'ai';
  text: string;
  add?: string[] | null;
  key?: string;
}

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600 - i * 160),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={styles.dotsRow}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { addTask } = useTaskStore();
  const scrollRef = useRef<ScrollView>(null);

  const [msgs, setMsgs] = useState<Msg[]>([
    { who: 'ai', text: "Salut 👋 Je suis l'assistant de vos listes. Demande-moi des quantités pour un repas, une idée recette, ou de répartir les courses." },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [addedKeys, setAddedKeys] = useState<Record<string, boolean>>({});

  const usedSuggestions = msgs.some(m => m.who === 'me');

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

  const ask = (q: string) => {
    if (!q.trim()) return;
    const ans = AI_ANSWERS[q] ?? DEFAULT_ANSWER;
    setMsgs(m => [...m, { who: 'me', text: q }]);
    setInput('');
    setTyping(true);
    scrollToBottom();
    setTimeout(() => {
      setTyping(false);
      const key = 'k' + Date.now();
      setMsgs(m => [...m, { who: 'ai', text: ans.text, add: ans.add, key }]);
      scrollToBottom();
    }, 1100);
  };

  const addItems = (items: string[], key: string) => {
    items.forEach(text => addTask({ text, project: 'courses' }));
    setAddedKeys(k => ({ ...k, [key]: true }));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: Colors.appBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 24 }}>✨</Text>
        </View>
        <View style={{ gap: 3 }}>
          <Text style={styles.headerTitle}>Assistant</Text>
          <View style={styles.headerSub}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubText}>Connecté à tes 4 listes</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {msgs.map((m, i) => (
          <View key={i} style={[styles.msgRow, m.who === 'me' ? styles.msgRowRight : styles.msgRowLeft]}>
            <View style={{ maxWidth: '86%', gap: 10 }}>
              <View style={[
                styles.bubble,
                m.who === 'me' ? styles.bubbleMe : styles.bubbleAI,
              ]}>
                <Text style={[styles.bubbleText, m.who === 'me' && { color: '#fff' }]}>{m.text}</Text>
              </View>

              {m.add && m.key && (
                <View style={styles.addCard}>
                  <Text style={styles.addCardEyebrow}>Suggestion · {m.add.length} articles</Text>
                  <View style={{ gap: 7 }}>
                    {m.add.map((a, j) => (
                      <View key={j} style={styles.addItem}>
                        <View style={styles.addDot} />
                        <Text style={styles.addItemText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => addItems(m.add!, m.key!)}
                    disabled={addedKeys[m.key]}
                    style={[styles.addBtn, addedKeys[m.key] && styles.addBtnDone]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.addBtnText, addedKeys[m.key] && { color: Colors.accentInk }]}>
                      {addedKeys[m.key] ? '✓ Ajouté à Courses' : '+ Tout ajouter à la liste'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}

        {typing && (
          <View style={styles.msgRowLeft}>
            <View style={styles.typingBubble}>
              <TypingDots />
            </View>
          </View>
        )}

        {!usedSuggestions && (
          <View style={{ gap: 8, marginTop: 4 }}>
            {AI_SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => ask(s)} style={styles.suggestion} activeOpacity={0.7}>
                <Text style={{ color: Colors.accent, fontSize: 15 }}>✨</Text>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Composer */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => ask(input.trim())}
            placeholder="Pose une question à l'assistant…"
            placeholderTextColor={Colors.faint}
            style={styles.input}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => ask(input.trim())}
            disabled={!input.trim()}
            style={[styles.sendBtn, { backgroundColor: input.trim() ? Colors.accent : Colors.surface2 }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18, color: input.trim() ? '#fff' : Colors.faint }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Space.lg, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.appBg },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 21, fontFamily: FontFamily.heading, color: Colors.ink },
  headerSub:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerSubText: { fontSize: 12.5, color: Colors.muted, fontWeight: '600' },
  onlineDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.accent },

  messages: { padding: Space.md, paddingBottom: 8, gap: 12 },
  msgRow:   { flexDirection: 'row' },
  msgRowLeft:  { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },

  bubble:     { borderRadius: 18, padding: 13, paddingHorizontal: 15 },
  bubbleMe:   { backgroundColor: Colors.accent, borderBottomRightRadius: 6 },
  bubbleAI:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: Colors.ink },

  typingBubble: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, borderRadius: 18, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 14 },
  dotsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot:     { width: 7, height: 7, borderRadius: 99, backgroundColor: Colors.faint },

  addCard:        { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, borderRadius: 16, padding: 12, gap: 10 },
  addCardEyebrow: { fontSize: 10, fontWeight: '700', color: Colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  addItem:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addDot:         { width: 5, height: 5, borderRadius: 99, backgroundColor: Colors.accent },
  addItemText:    { fontSize: 14.5, color: Colors.ink },
  addBtn:         { marginTop: 2, height: 42, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  addBtnDone:     { backgroundColor: Colors.accentSoft },
  addBtnText:     { fontSize: 14.5, fontWeight: '600', color: '#fff' },

  suggestion:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line },
  suggestionText: { fontSize: 14.5, fontWeight: '500', color: Colors.ink2, flex: 1 },

  composer:  { backgroundColor: Colors.appBg, borderTopWidth: 1, borderTopColor: Colors.line, padding: 14, paddingTop: 8 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 99, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: Colors.lineStrong, gap: 8 },
  input:     { flex: 1, fontSize: 15.5, color: Colors.ink, paddingVertical: 4 },
  sendBtn:   { width: 40, height: 40, borderRadius: 99, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
