// Localized UI chrome (labels, button text, system notes).
// Authored content (scenario, persona, objectives) is NOT translated here —
// it comes from the composition itself.
//
// To add a language: add a new key to LOCALES and translate every string.
// Missing keys fall back to English.

export type LocaleCode =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "it"
  | "tr"
  | "ja"
  | "zh"
  | "ar";

export const SUPPORTED_LOCALES: LocaleCode[] = [
  "en", "es", "fr", "de", "pt", "it", "tr", "ja", "zh", "ar",
];

export interface LocaleStrings {
  // Toolbar
  restart: string;
  finish: string;
  finishAndDebrief: string;
  muteVoice: string;
  unmuteVoice: string;
  downloadResults: string;
  useMyApiKey: string;
  scoringEllipsis: string;

  // Briefing modal
  rolePlayBriefing: string;
  scenario: string;
  yourObjective: string;
  yourObjectives: string;
  startRolePlay: string;
  briefingFooter: string; // {minutes}, {difficulty}
  difficultyEasy: string;
  difficultyRealistic: string;
  difficultyTough: string;

  // Sidebar
  objectives: string;
  debriefHelper: string;
  noObjectives: string;

  // Input bar
  getHint: string;
  voiceInput: string;
  send: string;
  typeMessage: string;
  listening: string;
  sessionEnded: string;
  dismissHint: string;
  tipLabel: string;

  // Counters
  messageOne: string; // "{n} message"
  messageOther: string; // "{n} messages"

  // Debrief modal
  sessionComplete: string;
  yourDebrief: string;
  close: string;
  closeAndContinue: string;
  totalScore: string; // "Total {score} / {max}"

  // BYO key panel
  usingYourKey: string; // {provider}
  usingBundledKey: string;
  providerLabel: string;
  apiKeyLabel: string;
  cloudflareAccountIdLabel: string;
  modelOptionalLabel: string;
  saveBtn: string;
  clearBtn: string;
  byoHint: string;
  apiKeyRequired: string;
  accountIdRequired: string;
  nowUsingYourKey: string; // {provider}
  clearedYourKey: string;

  // System notes / errors
  errorPrefix: string; // {message}
  scoringConversation: string;
  conversationScored: string;
  allObjectivesMet: string;
  turnLimitReached: string; // {n}
  hintFailed: string; // {message}

  // Defaults / fallbacks
  practiceConversation: string;
  practicePartner: string;
}

const en: LocaleStrings = {
  restart: "Restart",
  finish: "Finish",
  finishAndDebrief: "Finish & debrief",
  muteVoice: "Mute voice",
  unmuteVoice: "Unmute voice",
  downloadResults: "Download results",
  useMyApiKey: "Use my own API key",
  scoringEllipsis: "Scoring…",

  rolePlayBriefing: "Role-play briefing",
  scenario: "Scenario",
  yourObjective: "Your objective:",
  yourObjectives: "Your objectives",
  startRolePlay: "Start role-play",
  briefingFooter: "~{minutes} min session · {difficulty} difficulty",
  difficultyEasy: "easy",
  difficultyRealistic: "realistic",
  difficultyTough: "tough",

  objectives: "Objectives",
  debriefHelper: "Your debrief score reflects how well you hit these.",
  noObjectives: "No explicit objectives set.",

  getHint: "Get a hint",
  voiceInput: "Voice input",
  send: "Send",
  typeMessage: "Type your message…",
  listening: "Listening…",
  sessionEnded: "Session ended",
  dismissHint: "Dismiss",
  tipLabel: "Tip",

  messageOne: "{n} message",
  messageOther: "{n} messages",

  sessionComplete: "Session Complete",
  yourDebrief: "Your Debrief",
  close: "Close",
  closeAndContinue: "Close & Continue",
  totalScore: "Total {score} / {max}",

  usingYourKey: "Using your {provider} key",
  usingBundledKey: "Using the bundled key",
  providerLabel: "Provider",
  apiKeyLabel: "API key",
  cloudflareAccountIdLabel: "Cloudflare account ID",
  modelOptionalLabel: "Model (optional)",
  saveBtn: "Save",
  clearBtn: "Clear",
  byoHint: "Stored in this browser only. Overrides the bundled key for this session.",
  apiKeyRequired: "API key is required.",
  accountIdRequired: "Cloudflare account ID is required.",
  nowUsingYourKey: "Now using your {provider} key.",
  clearedYourKey: "Cleared your key; using the bundled key.",

  errorPrefix: "Error: {message}",
  scoringConversation: "Scoring the conversation…",
  conversationScored: "Conversation scored.",
  allObjectivesMet: "All objectives appear met. End the conversation when you're ready.",
  turnLimitReached: "Turn limit ({n}) reached. Wrapping up…",
  hintFailed: "Hint failed: {message}",

  practiceConversation: "Practice conversation",
  practicePartner: "Practice partner",
};

const es: LocaleStrings = {
  restart: "Reiniciar",
  finish: "Finalizar",
  finishAndDebrief: "Finalizar y revisar",
  muteVoice: "Silenciar voz",
  unmuteVoice: "Activar voz",
  downloadResults: "Descargar resultados",
  useMyApiKey: "Usar mi propia clave de API",
  scoringEllipsis: "Calificando…",

  rolePlayBriefing: "Resumen del juego de rol",
  scenario: "Escenario",
  yourObjective: "Tu objetivo:",
  yourObjectives: "Tus objetivos",
  startRolePlay: "Comenzar juego de rol",
  briefingFooter: "Sesión de ~{minutes} min · dificultad {difficulty}",
  difficultyEasy: "fácil",
  difficultyRealistic: "realista",
  difficultyTough: "difícil",

  objectives: "Objetivos",
  debriefHelper: "Tu puntuación final refleja qué tan bien los cumpliste.",
  noObjectives: "No hay objetivos definidos.",

  getHint: "Obtener una pista",
  voiceInput: "Entrada por voz",
  send: "Enviar",
  typeMessage: "Escribe tu mensaje…",
  listening: "Escuchando…",
  sessionEnded: "Sesión finalizada",
  dismissHint: "Descartar",
  tipLabel: "Sugerencia",

  messageOne: "{n} mensaje",
  messageOther: "{n} mensajes",

  sessionComplete: "Sesión completada",
  yourDebrief: "Tu informe",
  close: "Cerrar",
  closeAndContinue: "Cerrar y continuar",
  totalScore: "Total {score} / {max}",

  usingYourKey: "Usando tu clave de {provider}",
  usingBundledKey: "Usando la clave incluida",
  providerLabel: "Proveedor",
  apiKeyLabel: "Clave de API",
  cloudflareAccountIdLabel: "ID de cuenta de Cloudflare",
  modelOptionalLabel: "Modelo (opcional)",
  saveBtn: "Guardar",
  clearBtn: "Borrar",
  byoHint: "Se guarda solo en este navegador. Sustituye la clave incluida en esta sesión.",
  apiKeyRequired: "La clave de API es obligatoria.",
  accountIdRequired: "El ID de cuenta de Cloudflare es obligatorio.",
  nowUsingYourKey: "Ahora usando tu clave de {provider}.",
  clearedYourKey: "Clave eliminada; usando la clave incluida.",

  errorPrefix: "Error: {message}",
  scoringConversation: "Calificando la conversación…",
  conversationScored: "Conversación calificada.",
  allObjectivesMet: "Todos los objetivos parecen cumplidos. Termina la conversación cuando quieras.",
  turnLimitReached: "Límite de turnos ({n}) alcanzado. Cerrando…",
  hintFailed: "Falló la pista: {message}",

  practiceConversation: "Conversación de práctica",
  practicePartner: "Compañero de práctica",
};

const fr: LocaleStrings = {
  restart: "Recommencer",
  finish: "Terminer",
  finishAndDebrief: "Terminer et débriefer",
  muteVoice: "Couper la voix",
  unmuteVoice: "Activer la voix",
  downloadResults: "Télécharger les résultats",
  useMyApiKey: "Utiliser ma propre clé API",
  scoringEllipsis: "Évaluation…",

  rolePlayBriefing: "Briefing du jeu de rôle",
  scenario: "Scénario",
  yourObjective: "Votre objectif :",
  yourObjectives: "Vos objectifs",
  startRolePlay: "Démarrer le jeu de rôle",
  briefingFooter: "Session d'environ {minutes} min · difficulté {difficulty}",
  difficultyEasy: "facile",
  difficultyRealistic: "réaliste",
  difficultyTough: "difficile",

  objectives: "Objectifs",
  debriefHelper: "Votre note de débriefing reflète votre réussite sur ces points.",
  noObjectives: "Aucun objectif défini.",

  getHint: "Obtenir un indice",
  voiceInput: "Entrée vocale",
  send: "Envoyer",
  typeMessage: "Tapez votre message…",
  listening: "Écoute en cours…",
  sessionEnded: "Session terminée",
  dismissHint: "Ignorer",
  tipLabel: "Astuce",

  messageOne: "{n} message",
  messageOther: "{n} messages",

  sessionComplete: "Session terminée",
  yourDebrief: "Votre débriefing",
  close: "Fermer",
  closeAndContinue: "Fermer et continuer",
  totalScore: "Total {score} / {max}",

  usingYourKey: "Utilise votre clé {provider}",
  usingBundledKey: "Utilise la clé fournie",
  providerLabel: "Fournisseur",
  apiKeyLabel: "Clé API",
  cloudflareAccountIdLabel: "ID de compte Cloudflare",
  modelOptionalLabel: "Modèle (facultatif)",
  saveBtn: "Enregistrer",
  clearBtn: "Effacer",
  byoHint: "Stocké uniquement dans ce navigateur. Remplace la clé fournie pour cette session.",
  apiKeyRequired: "La clé API est requise.",
  accountIdRequired: "L'ID de compte Cloudflare est requis.",
  nowUsingYourKey: "Utilise maintenant votre clé {provider}.",
  clearedYourKey: "Clé effacée ; utilisation de la clé fournie.",

  errorPrefix: "Erreur : {message}",
  scoringConversation: "Évaluation de la conversation…",
  conversationScored: "Conversation évaluée.",
  allObjectivesMet: "Tous les objectifs semblent atteints. Terminez la conversation quand vous voulez.",
  turnLimitReached: "Limite de tours ({n}) atteinte. Conclusion…",
  hintFailed: "Échec de l'indice : {message}",

  practiceConversation: "Conversation d'entraînement",
  practicePartner: "Partenaire d'entraînement",
};

const de: LocaleStrings = {
  restart: "Neustart",
  finish: "Beenden",
  finishAndDebrief: "Beenden & Auswertung",
  muteVoice: "Stimme stummschalten",
  unmuteVoice: "Stimme aktivieren",
  downloadResults: "Ergebnisse herunterladen",
  useMyApiKey: "Eigenen API-Schlüssel verwenden",
  scoringEllipsis: "Bewertung…",

  rolePlayBriefing: "Rollenspiel-Briefing",
  scenario: "Szenario",
  yourObjective: "Dein Ziel:",
  yourObjectives: "Deine Ziele",
  startRolePlay: "Rollenspiel starten",
  briefingFooter: "~{minutes} Min. Sitzung · Schwierigkeit {difficulty}",
  difficultyEasy: "einfach",
  difficultyRealistic: "realistisch",
  difficultyTough: "schwer",

  objectives: "Ziele",
  debriefHelper: "Deine Auswertung zeigt, wie gut du diese erreicht hast.",
  noObjectives: "Keine Ziele festgelegt.",

  getHint: "Hinweis erhalten",
  voiceInput: "Spracheingabe",
  send: "Senden",
  typeMessage: "Nachricht eingeben…",
  listening: "Höre zu…",
  sessionEnded: "Sitzung beendet",
  dismissHint: "Schließen",
  tipLabel: "Tipp",

  messageOne: "{n} Nachricht",
  messageOther: "{n} Nachrichten",

  sessionComplete: "Sitzung abgeschlossen",
  yourDebrief: "Deine Auswertung",
  close: "Schließen",
  closeAndContinue: "Schließen & fortfahren",
  totalScore: "Gesamt {score} / {max}",

  usingYourKey: "Verwende deinen {provider}-Schlüssel",
  usingBundledKey: "Verwende den enthaltenen Schlüssel",
  providerLabel: "Anbieter",
  apiKeyLabel: "API-Schlüssel",
  cloudflareAccountIdLabel: "Cloudflare-Konto-ID",
  modelOptionalLabel: "Modell (optional)",
  saveBtn: "Speichern",
  clearBtn: "Löschen",
  byoHint: "Wird nur in diesem Browser gespeichert. Überschreibt den enthaltenen Schlüssel für diese Sitzung.",
  apiKeyRequired: "API-Schlüssel ist erforderlich.",
  accountIdRequired: "Cloudflare-Konto-ID ist erforderlich.",
  nowUsingYourKey: "Verwende jetzt deinen {provider}-Schlüssel.",
  clearedYourKey: "Schlüssel gelöscht; verwende den enthaltenen Schlüssel.",

  errorPrefix: "Fehler: {message}",
  scoringConversation: "Bewerte die Unterhaltung…",
  conversationScored: "Unterhaltung bewertet.",
  allObjectivesMet: "Alle Ziele scheinen erreicht. Beende die Unterhaltung, wann du bereit bist.",
  turnLimitReached: "Zugbegrenzung ({n}) erreicht. Abschluss…",
  hintFailed: "Hinweis fehlgeschlagen: {message}",

  practiceConversation: "Übungsgespräch",
  practicePartner: "Übungspartner",
};

const pt: LocaleStrings = {
  restart: "Reiniciar",
  finish: "Finalizar",
  finishAndDebrief: "Finalizar e revisar",
  muteVoice: "Silenciar voz",
  unmuteVoice: "Ativar voz",
  downloadResults: "Baixar resultados",
  useMyApiKey: "Usar minha própria chave de API",
  scoringEllipsis: "Avaliando…",

  rolePlayBriefing: "Resumo do role-play",
  scenario: "Cenário",
  yourObjective: "Seu objetivo:",
  yourObjectives: "Seus objetivos",
  startRolePlay: "Iniciar role-play",
  briefingFooter: "Sessão de ~{minutes} min · dificuldade {difficulty}",
  difficultyEasy: "fácil",
  difficultyRealistic: "realista",
  difficultyTough: "difícil",

  objectives: "Objetivos",
  debriefHelper: "Sua nota final reflete o quanto você os atingiu.",
  noObjectives: "Nenhum objetivo definido.",

  getHint: "Obter uma dica",
  voiceInput: "Entrada por voz",
  send: "Enviar",
  typeMessage: "Digite sua mensagem…",
  listening: "Ouvindo…",
  sessionEnded: "Sessão encerrada",
  dismissHint: "Dispensar",
  tipLabel: "Dica",

  messageOne: "{n} mensagem",
  messageOther: "{n} mensagens",

  sessionComplete: "Sessão concluída",
  yourDebrief: "Seu relatório",
  close: "Fechar",
  closeAndContinue: "Fechar e continuar",
  totalScore: "Total {score} / {max}",

  usingYourKey: "Usando sua chave {provider}",
  usingBundledKey: "Usando a chave incluída",
  providerLabel: "Provedor",
  apiKeyLabel: "Chave de API",
  cloudflareAccountIdLabel: "ID da conta Cloudflare",
  modelOptionalLabel: "Modelo (opcional)",
  saveBtn: "Salvar",
  clearBtn: "Limpar",
  byoHint: "Armazenado apenas neste navegador. Substitui a chave incluída nesta sessão.",
  apiKeyRequired: "A chave de API é obrigatória.",
  accountIdRequired: "O ID da conta Cloudflare é obrigatório.",
  nowUsingYourKey: "Agora usando sua chave {provider}.",
  clearedYourKey: "Chave removida; usando a chave incluída.",

  errorPrefix: "Erro: {message}",
  scoringConversation: "Avaliando a conversa…",
  conversationScored: "Conversa avaliada.",
  allObjectivesMet: "Todos os objetivos parecem cumpridos. Encerre a conversa quando quiser.",
  turnLimitReached: "Limite de turnos ({n}) atingido. Encerrando…",
  hintFailed: "Falha na dica: {message}",

  practiceConversation: "Conversa de prática",
  practicePartner: "Parceiro de prática",
};

const it: LocaleStrings = {
  restart: "Riavvia",
  finish: "Termina",
  finishAndDebrief: "Termina e rivedi",
  muteVoice: "Disattiva voce",
  unmuteVoice: "Attiva voce",
  downloadResults: "Scarica risultati",
  useMyApiKey: "Usa la mia chiave API",
  scoringEllipsis: "Valutazione…",

  rolePlayBriefing: "Briefing del role-play",
  scenario: "Scenario",
  yourObjective: "Il tuo obiettivo:",
  yourObjectives: "I tuoi obiettivi",
  startRolePlay: "Inizia role-play",
  briefingFooter: "Sessione di ~{minutes} min · difficoltà {difficulty}",
  difficultyEasy: "facile",
  difficultyRealistic: "realistico",
  difficultyTough: "difficile",

  objectives: "Obiettivi",
  debriefHelper: "Il punteggio del debrief riflette quanto li hai raggiunti.",
  noObjectives: "Nessun obiettivo impostato.",

  getHint: "Ottieni un suggerimento",
  voiceInput: "Input vocale",
  send: "Invia",
  typeMessage: "Scrivi un messaggio…",
  listening: "In ascolto…",
  sessionEnded: "Sessione terminata",
  dismissHint: "Ignora",
  tipLabel: "Suggerimento",

  messageOne: "{n} messaggio",
  messageOther: "{n} messaggi",

  sessionComplete: "Sessione completata",
  yourDebrief: "Il tuo debrief",
  close: "Chiudi",
  closeAndContinue: "Chiudi e continua",
  totalScore: "Totale {score} / {max}",

  usingYourKey: "Stai usando la tua chiave {provider}",
  usingBundledKey: "Stai usando la chiave inclusa",
  providerLabel: "Fornitore",
  apiKeyLabel: "Chiave API",
  cloudflareAccountIdLabel: "ID account Cloudflare",
  modelOptionalLabel: "Modello (opzionale)",
  saveBtn: "Salva",
  clearBtn: "Cancella",
  byoHint: "Salvata solo in questo browser. Sostituisce la chiave inclusa per questa sessione.",
  apiKeyRequired: "La chiave API è obbligatoria.",
  accountIdRequired: "L'ID account Cloudflare è obbligatorio.",
  nowUsingYourKey: "Ora stai usando la tua chiave {provider}.",
  clearedYourKey: "Chiave eliminata; sto usando la chiave inclusa.",

  errorPrefix: "Errore: {message}",
  scoringConversation: "Valutando la conversazione…",
  conversationScored: "Conversazione valutata.",
  allObjectivesMet: "Tutti gli obiettivi sembrano raggiunti. Termina la conversazione quando vuoi.",
  turnLimitReached: "Limite di turni ({n}) raggiunto. Sto concludendo…",
  hintFailed: "Suggerimento fallito: {message}",

  practiceConversation: "Conversazione di pratica",
  practicePartner: "Partner di pratica",
};

const tr: LocaleStrings = {
  restart: "Yeniden başlat",
  finish: "Bitir",
  finishAndDebrief: "Bitir ve değerlendir",
  muteVoice: "Sesi kapat",
  unmuteVoice: "Sesi aç",
  downloadResults: "Sonuçları indir",
  useMyApiKey: "Kendi API anahtarımı kullan",
  scoringEllipsis: "Puanlanıyor…",

  rolePlayBriefing: "Rol yapma brifingi",
  scenario: "Senaryo",
  yourObjective: "Hedefin:",
  yourObjectives: "Hedeflerin",
  startRolePlay: "Rol yapmayı başlat",
  briefingFooter: "~{minutes} dk oturum · {difficulty} zorluk",
  difficultyEasy: "kolay",
  difficultyRealistic: "gerçekçi",
  difficultyTough: "zor",

  objectives: "Hedefler",
  debriefHelper: "Değerlendirme puanın bunları ne kadar tutturduğunu yansıtır.",
  noObjectives: "Belirlenmiş bir hedef yok.",

  getHint: "İpucu al",
  voiceInput: "Sesli giriş",
  send: "Gönder",
  typeMessage: "Mesajını yaz…",
  listening: "Dinleniyor…",
  sessionEnded: "Oturum sona erdi",
  dismissHint: "Kapat",
  tipLabel: "İpucu",

  messageOne: "{n} mesaj",
  messageOther: "{n} mesaj",

  sessionComplete: "Oturum tamamlandı",
  yourDebrief: "Değerlendirmen",
  close: "Kapat",
  closeAndContinue: "Kapat ve devam et",
  totalScore: "Toplam {score} / {max}",

  usingYourKey: "{provider} anahtarın kullanılıyor",
  usingBundledKey: "Pakete dahil anahtar kullanılıyor",
  providerLabel: "Sağlayıcı",
  apiKeyLabel: "API anahtarı",
  cloudflareAccountIdLabel: "Cloudflare hesap kimliği",
  modelOptionalLabel: "Model (isteğe bağlı)",
  saveBtn: "Kaydet",
  clearBtn: "Temizle",
  byoHint: "Yalnızca bu tarayıcıda saklanır. Bu oturum için pakete dahil anahtarın yerine geçer.",
  apiKeyRequired: "API anahtarı gerekli.",
  accountIdRequired: "Cloudflare hesap kimliği gerekli.",
  nowUsingYourKey: "Artık {provider} anahtarın kullanılıyor.",
  clearedYourKey: "Anahtarın temizlendi; pakete dahil anahtar kullanılıyor.",

  errorPrefix: "Hata: {message}",
  scoringConversation: "Konuşma puanlanıyor…",
  conversationScored: "Konuşma puanlandı.",
  allObjectivesMet: "Tüm hedeflere ulaşılmış görünüyor. Hazır olduğunda konuşmayı sonlandır.",
  turnLimitReached: "Tur sınırı ({n}) doldu. Bitiriliyor…",
  hintFailed: "İpucu başarısız: {message}",

  practiceConversation: "Pratik konuşma",
  practicePartner: "Pratik partneri",
};

const ja: LocaleStrings = {
  restart: "リスタート",
  finish: "終了",
  finishAndDebrief: "終了して振り返り",
  muteVoice: "音声をミュート",
  unmuteVoice: "音声をオン",
  downloadResults: "結果をダウンロード",
  useMyApiKey: "自分のAPIキーを使う",
  scoringEllipsis: "採点中…",

  rolePlayBriefing: "ロールプレイの説明",
  scenario: "シナリオ",
  yourObjective: "あなたの目標:",
  yourObjectives: "あなたの目標",
  startRolePlay: "ロールプレイを開始",
  briefingFooter: "約{minutes}分のセッション · 難易度: {difficulty}",
  difficultyEasy: "やさしい",
  difficultyRealistic: "リアル",
  difficultyTough: "難しい",

  objectives: "目標",
  debriefHelper: "振り返りスコアは、これらをどれだけ達成したかを示します。",
  noObjectives: "目標は設定されていません。",

  getHint: "ヒントを取得",
  voiceInput: "音声入力",
  send: "送信",
  typeMessage: "メッセージを入力…",
  listening: "聞き取り中…",
  sessionEnded: "セッション終了",
  dismissHint: "閉じる",
  tipLabel: "ヒント",

  messageOne: "{n}件のメッセージ",
  messageOther: "{n}件のメッセージ",

  sessionComplete: "セッション完了",
  yourDebrief: "振り返り",
  close: "閉じる",
  closeAndContinue: "閉じて続ける",
  totalScore: "合計 {score} / {max}",

  usingYourKey: "あなたの{provider}キーを使用中",
  usingBundledKey: "同梱キーを使用中",
  providerLabel: "プロバイダー",
  apiKeyLabel: "APIキー",
  cloudflareAccountIdLabel: "CloudflareアカウントID",
  modelOptionalLabel: "モデル(任意)",
  saveBtn: "保存",
  clearBtn: "クリア",
  byoHint: "このブラウザにのみ保存されます。このセッション中は同梱キーの代わりに使われます。",
  apiKeyRequired: "APIキーは必須です。",
  accountIdRequired: "CloudflareアカウントIDは必須です。",
  nowUsingYourKey: "あなたの{provider}キーを使用しています。",
  clearedYourKey: "キーをクリアしました。同梱キーを使用します。",

  errorPrefix: "エラー: {message}",
  scoringConversation: "会話を採点中…",
  conversationScored: "会話を採点しました。",
  allObjectivesMet: "すべての目標が達成されたようです。準備ができたら会話を終えてください。",
  turnLimitReached: "ターン上限({n})に達しました。締めくくります…",
  hintFailed: "ヒントの取得に失敗: {message}",

  practiceConversation: "練習会話",
  practicePartner: "練習相手",
};

const zh: LocaleStrings = {
  restart: "重新开始",
  finish: "结束",
  finishAndDebrief: "结束并复盘",
  muteVoice: "静音",
  unmuteVoice: "取消静音",
  downloadResults: "下载结果",
  useMyApiKey: "使用我自己的 API 密钥",
  scoringEllipsis: "评分中…",

  rolePlayBriefing: "角色扮演简介",
  scenario: "场景",
  yourObjective: "你的目标:",
  yourObjectives: "你的目标",
  startRolePlay: "开始角色扮演",
  briefingFooter: "约 {minutes} 分钟 · {difficulty}难度",
  difficultyEasy: "简单",
  difficultyRealistic: "正常",
  difficultyTough: "困难",

  objectives: "目标",
  debriefHelper: "你的复盘分数反映了完成这些目标的程度。",
  noObjectives: "未设置目标。",

  getHint: "获取提示",
  voiceInput: "语音输入",
  send: "发送",
  typeMessage: "输入消息…",
  listening: "聆听中…",
  sessionEnded: "会话已结束",
  dismissHint: "关闭",
  tipLabel: "提示",

  messageOne: "{n} 条消息",
  messageOther: "{n} 条消息",

  sessionComplete: "会话完成",
  yourDebrief: "你的复盘",
  close: "关闭",
  closeAndContinue: "关闭并继续",
  totalScore: "总计 {score} / {max}",

  usingYourKey: "正在使用你的 {provider} 密钥",
  usingBundledKey: "正在使用内置密钥",
  providerLabel: "提供商",
  apiKeyLabel: "API 密钥",
  cloudflareAccountIdLabel: "Cloudflare 账户 ID",
  modelOptionalLabel: "模型(可选)",
  saveBtn: "保存",
  clearBtn: "清除",
  byoHint: "仅保存在此浏览器中。在此会话中覆盖内置密钥。",
  apiKeyRequired: "API 密钥是必填项。",
  accountIdRequired: "Cloudflare 账户 ID 是必填项。",
  nowUsingYourKey: "现已使用你的 {provider} 密钥。",
  clearedYourKey: "已清除你的密钥;使用内置密钥。",

  errorPrefix: "错误: {message}",
  scoringConversation: "正在为对话评分…",
  conversationScored: "对话已评分。",
  allObjectivesMet: "所有目标似乎都已达成。准备好后即可结束对话。",
  turnLimitReached: "已达回合上限({n})。即将收尾…",
  hintFailed: "提示失败: {message}",

  practiceConversation: "练习对话",
  practicePartner: "练习伙伴",
};

const ar: LocaleStrings = {
  restart: "إعادة التشغيل",
  finish: "إنهاء",
  finishAndDebrief: "إنهاء ومراجعة",
  muteVoice: "كتم الصوت",
  unmuteVoice: "تشغيل الصوت",
  downloadResults: "تنزيل النتائج",
  useMyApiKey: "استخدام مفتاح API الخاص بي",
  scoringEllipsis: "جارٍ التقييم…",

  rolePlayBriefing: "ملخص لعب الأدوار",
  scenario: "السيناريو",
  yourObjective: "هدفك:",
  yourObjectives: "أهدافك",
  startRolePlay: "بدء لعب الأدوار",
  briefingFooter: "جلسة ~{minutes} دقيقة · صعوبة {difficulty}",
  difficultyEasy: "سهل",
  difficultyRealistic: "واقعي",
  difficultyTough: "صعب",

  objectives: "الأهداف",
  debriefHelper: "تعكس درجة المراجعة مدى تحقيقك لهذه الأهداف.",
  noObjectives: "لا توجد أهداف محددة.",

  getHint: "الحصول على تلميح",
  voiceInput: "إدخال صوتي",
  send: "إرسال",
  typeMessage: "اكتب رسالتك…",
  listening: "جارٍ الاستماع…",
  sessionEnded: "انتهت الجلسة",
  dismissHint: "إغلاق",
  tipLabel: "نصيحة",

  messageOne: "{n} رسالة",
  messageOther: "{n} رسالة",

  sessionComplete: "اكتملت الجلسة",
  yourDebrief: "مراجعتك",
  close: "إغلاق",
  closeAndContinue: "إغلاق ومتابعة",
  totalScore: "الإجمالي {score} / {max}",

  usingYourKey: "يتم استخدام مفتاح {provider} الخاص بك",
  usingBundledKey: "يتم استخدام المفتاح المضمّن",
  providerLabel: "المزود",
  apiKeyLabel: "مفتاح API",
  cloudflareAccountIdLabel: "معرّف حساب Cloudflare",
  modelOptionalLabel: "النموذج (اختياري)",
  saveBtn: "حفظ",
  clearBtn: "مسح",
  byoHint: "يتم تخزينه في هذا المتصفح فقط. يتجاوز المفتاح المضمّن لهذه الجلسة.",
  apiKeyRequired: "مفتاح API مطلوب.",
  accountIdRequired: "معرّف حساب Cloudflare مطلوب.",
  nowUsingYourKey: "يتم الآن استخدام مفتاح {provider} الخاص بك.",
  clearedYourKey: "تم مسح المفتاح؛ يتم استخدام المفتاح المضمّن.",

  errorPrefix: "خطأ: {message}",
  scoringConversation: "جارٍ تقييم المحادثة…",
  conversationScored: "تم تقييم المحادثة.",
  allObjectivesMet: "يبدو أن جميع الأهداف قد تحققت. أنهِ المحادثة عندما تكون جاهزًا.",
  turnLimitReached: "تم بلوغ حد الأدوار ({n}). جارٍ الإنهاء…",
  hintFailed: "فشل التلميح: {message}",

  practiceConversation: "محادثة تدريبية",
  practicePartner: "شريك التدريب",
};

export const LOCALES: Record<LocaleCode, LocaleStrings> = {
  en, es, fr, de, pt, it, tr, ja, zh, ar,
};

export function normalizeLocale(raw: string | null | undefined): LocaleCode {
  if (!raw) return "en";
  const lower = raw.toLowerCase();
  const base = lower.split(/[-_]/)[0] as LocaleCode;
  return (SUPPORTED_LOCALES as string[]).includes(base) ? base : "en";
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
}

export function t(
  locale: string,
  key: keyof LocaleStrings,
  params?: Record<string, string | number>,
): string {
  const code = normalizeLocale(locale);
  const table = LOCALES[code] || LOCALES.en;
  const raw = table[key] ?? LOCALES.en[key] ?? String(key);
  return interpolate(raw, params);
}
