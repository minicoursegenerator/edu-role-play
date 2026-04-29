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


  errorPrefix: "Error: {message}",
  scoringConversation: "Scoring the conversation…",
  conversationScored: "Conversation scored.",
  allObjectivesMet: "All objectives met. Wrapping up…",
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


  errorPrefix: "Error: {message}",
  scoringConversation: "Calificando la conversación…",
  conversationScored: "Conversación calificada.",
  allObjectivesMet: "Todos los objetivos cumplidos. Cerrando…",
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


  errorPrefix: "Erreur : {message}",
  scoringConversation: "Évaluation de la conversation…",
  conversationScored: "Conversation évaluée.",
  allObjectivesMet: "Tous les objectifs atteints. Clôture en cours…",
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


  errorPrefix: "Fehler: {message}",
  scoringConversation: "Bewerte die Unterhaltung…",
  conversationScored: "Unterhaltung bewertet.",
  allObjectivesMet: "Alle Ziele erreicht. Abschluss läuft…",
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


  errorPrefix: "Erro: {message}",
  scoringConversation: "Avaliando a conversa…",
  conversationScored: "Conversa avaliada.",
  allObjectivesMet: "Todos os objetivos cumpridos. Encerrando…",
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


  errorPrefix: "Errore: {message}",
  scoringConversation: "Valutando la conversazione…",
  conversationScored: "Conversazione valutata.",
  allObjectivesMet: "Tutti gli obiettivi raggiunti. Chiusura…",
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


  errorPrefix: "Hata: {message}",
  scoringConversation: "Konuşma puanlanıyor…",
  conversationScored: "Konuşma puanlandı.",
  allObjectivesMet: "Tüm hedeflere ulaşıldı. Tamamlanıyor…",
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


  errorPrefix: "エラー: {message}",
  scoringConversation: "会話を採点中…",
  conversationScored: "会話を採点しました。",
  allObjectivesMet: "すべての目標が達成されました。終了します…",
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


  errorPrefix: "错误: {message}",
  scoringConversation: "正在为对话评分…",
  conversationScored: "对话已评分。",
  allObjectivesMet: "所有目标已达成。即将结束…",
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


  errorPrefix: "خطأ: {message}",
  scoringConversation: "جارٍ تقييم المحادثة…",
  conversationScored: "تم تقييم المحادثة.",
  allObjectivesMet: "تم تحقيق جميع الأهداف. جارٍ الإنهاء…",
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
