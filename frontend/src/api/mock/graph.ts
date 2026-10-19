/** Demo-mode narrative graph, Tree of Life energies and memory archive. Fictional sample person. */
import { PATHS } from '@/data/sephiroth'
import type { GraphBuildResult, MemoryRecord, PathState, SephirahId, SephirothState } from '@/types'

const ENERGY: Record<SephirahId, number> = {
  kether: 0.58, chokmah: 0.71, binah: 0.64, chesed: 0.42, geburah: 0.83,
  tiphereth: 0.55, netzach: 0.36, hod: 0.78, yesod: 0.69, malkuth: 0.47,
}

const NARRATIVE: Partial<Record<SephirahId, { narrative: string; beliefs: string[]; memoryIds: string[] }>> = {
  geburah: {
    narrative: 'Strong boundary-making energy. Discipline often arrives before desire has been heard; the Limiter speaks first in most recorded decisions.',
    beliefs: ['Rest has to be earned', 'Mistakes are visible and permanent'],
    memoryIds: ['m03', 'm07', 'm12'],
  },
  hod: {
    narrative: 'Analysis is the preferred refuge. Many diary entries resolve feelings by explaining them.',
    beliefs: ['If I understand it, it cannot hurt me'],
    memoryIds: ['m05', 'm09', 'm14'],
  },
  netzach: {
    narrative: 'Creative desire is present but under-fed. Entries about making things are frequent in dreams and rare in daytime records.',
    beliefs: ['Wanting something openly is risky'],
    memoryIds: ['m02', 'm10', 'm16'],
  },
  yesod: {
    narrative: 'Dense, image-rich content. Recurring water and threshold dreams cluster here; this is where the shadow field most often activates.',
    beliefs: ['Something is waiting behind the door'],
    memoryIds: ['m02', 'm06', 'm10', 'm16'],
  },
  tiphereth: {
    narrative: 'The integration centre is reachable but intermittently flooded by Geburah. Moments of coherence follow honest conversations.',
    beliefs: ['I am more than my usefulness'],
    memoryIds: ['m08', 'm13', 'm18'],
  },
  chokmah: {
    narrative: 'Sudden insight is common and quickly handed to Binah to be structured — sometimes before it has fully formed.',
    beliefs: [],
    memoryIds: ['m11'],
  },
  binah: {
    narrative: 'Structure and form; the capacity to hold. Connected to the BaZi metal emphasis.',
    beliefs: ['Order is safety'],
    memoryIds: ['m01', 'm04'],
  },
  kether: { narrative: 'The stated intent: to stop living as a project and start living as a person.', beliefs: [], memoryIds: [] },
  chesed: { narrative: 'Generosity flows outward easily; inward it narrows.', beliefs: ['Others first'], memoryIds: ['m15'] },
  malkuth: { narrative: 'Body and daily life. Sleep, movement and place appear as signals before they become words.', beliefs: [], memoryIds: ['m17'] },
}

const FLOW: Record<number, number> = {
  11: 0.4, 12: 0.35, 13: 0.22, 14: 0.62, 15: 0.3, 16: 0.18, 17: 0.4, 18: 0.74, 19: -0.52, 20: 0.2,
  21: 0.15, 22: 0.66, 23: 0.58, 24: -0.12, 25: 0.31, 26: 0.48, 27: -0.44, 28: 0.25, 29: 0.1, 30: 0.52,
  31: 0.34, 32: 0.38,
}
const STAGNANT = new Set([21, 24, 29])

export function demoSephiroth(): SephirothState {
  const paths: PathState[] = PATHS.map((p) => ({
    id: p.id,
    from: p.from,
    to: p.to,
    flow: FLOW[p.id],
    weight: Math.min(1, Math.abs(FLOW[p.id]) + 0.2),
    stagnant: STAGNANT.has(p.id),
  }))
  return {
    nodes: (Object.keys(ENERGY) as SephirahId[]).map((id) => ({ id, energy: ENERGY[id], ...NARRATIVE[id] })),
    paths,
    updatedAt: new Date().toISOString(),
  }
}

export function demoBuild(files: number, hasText: boolean): Promise<GraphBuildResult> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          graphId: `g_demo_${Date.now().toString(36)}`,
          entities: 140 + files * 37 + (hasText ? 22 : 0),
          relations: 310 + files * 81 + (hasText ? 40 : 0),
          beliefClusters: [
            { id: 'b1', label: 'Rest has to be earned', weight: 0.82 },
            { id: 'b2', label: 'Understanding as protection', weight: 0.71 },
            { id: 'b3', label: 'Desire is risky to show', weight: 0.58 },
            { id: 'b4', label: 'Others first', weight: 0.44 },
          ],
          emotionalAnchors: [
            { id: 'a1', label: 'Grandmother’s kitchen', valence: 0.8 },
            { id: 'a2', label: 'The exam year', valence: -0.6 },
            { id: 'a3', label: 'Recurring tide dream', valence: -0.1 },
          ],
        }),
      1400,
    ),
  )
}

const M = (r: Omit<MemoryRecord, 'excerpt'> & { excerpt?: string }): MemoryRecord => ({
  ...r,
  excerpt: r.excerpt ?? r.body.split('. ').slice(0, 1).join('. ') + '.',
})

export function demoMemories(): MemoryRecord[] {
  return [
    M({ id: 'm01', title: 'Birth chart anchored', date: '1990-05-15', kind: 'innate', sephirah: 'binah', valence: 0, intensity: 0.5, tags: ['bazi', 'vedic'], links: ['m04'],
      body: 'Day master 庚 metal, born in 巳 month. Leo ascendant, Moon in Sagittarius. Recorded as innate memory: the initial conditions the council starts from.' }),
    M({ id: 'm02', title: 'The tide comes into the house', date: '2009-08-03', kind: 'dream', sephirah: 'yesod', valence: -0.3, intensity: 0.8, tags: ['water', 'threshold'], links: ['m06', 'm10', 'm16'],
      body: 'Water rises through the floorboards of my grandmother’s house. I am not afraid, which surprises me. I keep trying to save the notebooks on the lowest shelf. A door at the end of the corridor is open and the light from it is green.' }),
    M({ id: 'm03', title: 'Exam results', date: '2008-06-25', kind: 'event', sephirah: 'geburah', valence: -0.6, intensity: 0.9, tags: ['achievement', 'family'], links: ['m07', 'm12'],
      body: 'Results came in two points short. Nobody was angry, which was worse. I decided that night that I would never again leave anything to chance.' }),
    M({ id: 'm04', title: 'Grandmother’s kitchen', date: '1998-02-14', kind: 'event', sephirah: 'binah', valence: 0.8, intensity: 0.7, tags: ['family', 'safety'], links: ['m01', 'm02'],
      body: 'Folding dumplings at the low table. She corrects my pleats without comment and lets me keep the crooked ones. The radio plays opera too quietly to follow.' }),
    M({ id: 'm05', title: 'Explaining instead of feeling', date: '2015-11-02', kind: 'diary', sephirah: 'hod', valence: -0.2, intensity: 0.5, tags: ['pattern', 'analysis'], links: ['m09', 'm14'],
      body: 'Wrote four pages about why the breakup made sense. Not one sentence about how it felt. Noticing that only now, reading it back.' }),
    M({ id: 'm06', title: 'Green door, again', date: '2017-03-19', kind: 'dream', sephirah: 'yesod', valence: 0.1, intensity: 0.7, tags: ['threshold', 'recurring'], links: ['m02', 'm16'],
      body: 'Same corridor. This time the green door is closed and someone is humming behind it. I wake before I knock.' }),
    M({ id: 'm07', title: 'Promotion and insomnia', date: '2019-09-10', kind: 'diary', sephirah: 'geburah', valence: -0.4, intensity: 0.6, tags: ['work', 'body'], links: ['m03', 'm12', 'm17'],
      body: 'Got the role. Have not slept more than five hours since. Keep making lists at 3 a.m. of things that could go wrong.' }),
    M({ id: 'm08', title: 'A conversation with L.', date: '2020-04-22', kind: 'conversation', sephirah: 'tiphereth', valence: 0.7, intensity: 0.6, tags: ['friendship', 'honesty'], links: ['m13'],
      body: 'L. asked what I would do if nothing needed fixing. I didn’t have an answer and we sat with that for a long time. It felt like the first honest silence in months.' }),
    M({ id: 'm09', title: 'Reading Jung on the train', date: '2021-01-08', kind: 'diary', sephirah: 'hod', valence: 0.3, intensity: 0.4, tags: ['reading', 'shadow'], links: ['m05', 'm14'],
      body: '“One does not become enlightened by imagining figures of light, but by making the darkness conscious.” Underlined twice. Felt accused and relieved at once.' }),
    M({ id: 'm10', title: 'Painting in the dream studio', date: '2021-07-30', kind: 'dream', sephirah: 'netzach', valence: 0.6, intensity: 0.7, tags: ['creativity', 'desire'], links: ['m02', 'm16'],
      body: 'A large studio with wet canvases. I paint with my hands, quickly, without deciding anything. The colours are the greens and lavenders of the tide dream.' }),
    M({ id: 'm11', title: 'Sudden clarity on the bridge', date: '2022-05-14', kind: 'diary', sephirah: 'chokmah', valence: 0.5, intensity: 0.5, tags: ['insight'], links: ['m13'],
      body: 'Crossing the river: the thought that I have been treating my life as a problem to solve. Wrote it on my hand so I wouldn’t lose it.' }),
    M({ id: 'm12', title: 'Cancelled the trip', date: '2023-02-03', kind: 'event', sephirah: 'geburah', valence: -0.5, intensity: 0.6, tags: ['work', 'avoidance'], links: ['m03', 'm07'],
      body: 'Cancelled the trip to the coast for a deadline that moved anyway. Told myself it was responsible. Noticed the relief was very small.' }),
    M({ id: 'm13', title: 'Saying no to the second project', date: '2024-03-11', kind: 'event', sephirah: 'tiphereth', valence: 0.6, intensity: 0.7, tags: ['boundaries', 'integration'], links: ['m08', 'm11', 'm18'],
      body: 'Declined the second project. Hands shaking afterwards. Then a long, strange calm — like a room after the radiator stops.' }),
    M({ id: 'm14', title: 'Therapy, session nine', date: '2024-10-29', kind: 'conversation', sephirah: 'hod', valence: 0.2, intensity: 0.6, tags: ['therapy', 'pattern'], links: ['m05', 'm09'],
      body: 'She pointed out that I narrate my feelings in the past tense even while having them. Homework: one sentence a day in the present tense.' }),
    M({ id: 'm15', title: 'Helping M. move', date: '2025-06-07', kind: 'event', sephirah: 'chesed', valence: 0.5, intensity: 0.4, tags: ['friendship', 'giving'], links: [],
      body: 'Carried boxes all day and was happier than I have been in weeks. Wondered why it is so much easier to give than to ask.' }),
    M({ id: 'm16', title: 'Knocking on the green door', date: '2025-12-21', kind: 'dream', sephirah: 'yesod', valence: 0.4, intensity: 0.9, tags: ['threshold', 'recurring', 'shadow'], links: ['m02', 'm06', 'm10'],
      body: 'I knock. A younger version of me opens it, holding a paintbrush and looking annoyed that I took so long. Behind her the studio from the other dream.' }),
    M({ id: 'm17', title: 'Body first', date: '2026-04-02', kind: 'diary', sephirah: 'malkuth', valence: 0.3, intensity: 0.4, tags: ['body', 'rest'], links: ['m07'],
      body: 'Jaw tight again before I noticed I was anxious. Trying to treat the body as the first messenger rather than the last.' }),
    M({ id: 'm18', title: 'Present tense', date: '2026-09-17', kind: 'diary', sephirah: 'tiphereth', valence: 0.6, intensity: 0.5, tags: ['integration', 'practice'], links: ['m13', 'm14'],
      body: 'I want to paint. I am afraid it will be bad. I am going to do it anyway on Saturday.' }),
  ]
}
