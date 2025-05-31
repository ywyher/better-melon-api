import { t } from "elysia";

/**
 * xref - Complete reference format: word + reading + sense index
 */
export const xrefWordReadingIndex = t.Tuple([
  t.String(), // kanji
  t.String(), // kana
  t.Number()  // senseIndex
]);

/**
 * xref - Shorter reference format: word + reading, without sense index
 */
export const xrefWordReading = t.Tuple([
  t.String(), // kanji
  t.String()  // kana
]);

/**
 * xref - Shorter reference format: word (can be kana-only or contain kanji) + sense index
 */
export const xrefWordIndex = t.Tuple([
  t.String(), // kanjiOrKana
  t.Number()  // senseIndex
]);

/**
 * xref - The shortest reference format: just the word (can be kana-only or contain kanji)
 */
export const xrefWord = t.Tuple([
  t.String() // kanjiOrKana
]);

/**
 * xref - Cross-reference
 *
 * Examples:
 * - `["丸", "まる", 1]` - refers to the word "丸", read as "まる" ("maru"),
 * specifically the 1st sense element
 * - `["○", "まる", 1]` - same as previous, but "○" is a special character
 * for the word "丸"
 * - `["二重丸", "にじゅうまる"]` - refers to the word "二重丸",
 * read as "にじゅうまる" ("nijoumaru")
 * - `["漢数字"]` - refers to the word "漢数字", with any reading
 */

export const xref = t.Union([
  xrefWordReadingIndex,
  xrefWordReading,
  xrefWordIndex,
  xrefWord
]);

export const jmdictLanguageSoruce = t.Object({
  lang: t.String(),
  full: t.Boolean(),
  wasei: t.Boolean(),
  text: t.Nullable(t.String())
})

export const jmdictGender = t.Union([
  t.Literal('masculine'),
  t.Literal('feminine'),
  t.Literal('neuter')
]);

export const jmdictGlossType = t.Union([
  t.Literal('literal'),
  t.Literal('figurative'),
  t.Literal('explanation'),
  t.Literal('trademark')
]);

export const jmdictGloss = t.Object({
  lang: t.String(), // Language3Letter is just a string
  gender: t.Union([jmdictGender, t.Null()]),
  type: t.Union([jmdictGlossType, t.Null()]),
  text: t.String()
});

export const jmdictKanji = t.Object({
  common: t.Boolean(),
  text: t.String(),
  tags: t.Array(t.String()),
})

export const jmdictKana = t.Object({
  common: t.Boolean(),
  text: t.String(),
  tags: t.Array(t.String()),
  appliesToKanji: t.Array(t.String())
})

export const jmdictSense = t.Object({
  partOfSpeech: t.Array(t.String()),
  appliesToKanji: t.Array(t.String()),
  appliesToKana: t.Array(t.String()),
  related: t.Array(xref),
  antonym: t.Array(xref),
  field: t.Array(t.String()),
  dialect: t.Array(t.String()),
  misc: t.Array(t.String()),
  info: t.Array(t.String()),
  languageSource: t.Array(jmdictLanguageSoruce),
  gloss: t.Array(jmdictGloss)
})

export const jmdictWord = t.Object({
  id: t.String(),
  kanji: t.Array(jmdictKanji),
  kana: t.Array(jmdictKana),
  sense: t.Array(jmdictSense)
})


export type XrefWordReadingIndex = typeof xrefWordReadingIndex.static
export type XrefWordReading = typeof xrefWordReading.static
export type XrefWordIndex = typeof xrefWordIndex.static
export type XrefWord = typeof xrefWord.static
export type Xref = typeof xref.static
export type JmdictLanguageSoruce = typeof jmdictLanguageSoruce.static
export type JmdictGender = typeof jmdictGender.static
export type JmdictGlossType = typeof jmdictGlossType.static
export type JmdictGloss = typeof jmdictGloss.static
export type JmdictKanji = typeof jmdictKanji.static
export type JmdictKana = typeof jmdictKana.static
export type JmdictSense = typeof jmdictSense.static
export type JmdictWord = typeof jmdictWord.static