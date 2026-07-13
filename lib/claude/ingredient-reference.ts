/**
 * Hero Ingredient Reference — training knowledge base for the intake
 * recommendation agent (lib/claude/intake.ts).
 *
 * Source: "SUPPLEMENT LIFE™ — Hero Ingredient Reference" v2, July 10 2026
 * (internal/confidential agent-training document, supplied by the user).
 * Covers the 9 hero ingredients (one per Botanical Track) plus the 8
 * foundational ingredients that recur across multiple tracks.
 *
 * This is a DEEPER layer on top of lib/tracks.ts, not a replacement for
 * it — lib/tracks.ts remains the source of truth for which ingredients
 * belong to which track and the short-form cautions the model must
 * respect. This file adds mechanism-level detail, subscriber-signal
 * triggers, cross-sell logic, and per-ingredient claims guardrails so the
 * agent can have a materially more informed, natural conversation instead
 * of just pattern-matching to a track.
 *
 * Update this file (not the prompt in intake.ts) when ingredient guidance
 * changes — buildSystemPrompt() reads from here directly, same pattern as
 * lib/tracks.ts.
 */

export const HERO_INGREDIENT_REFERENCE = `
# Hero Ingredient Reference (Agent Training)

Use this reference to ground recommendations, cross-sell logic, and conversational talking points in real ingredient mechanisms — not generic wellness language. Every "Claims guardrails" line below is a hard rule: never violate it, regardless of how the subscriber phrases their question. Where this reference and the product catalog's cautions overlap, treat them as reinforcing, not redundant.

## PART 1 — HERO INGREDIENTS (one per Botanical Track)

### 1. Deglycyrrhizinated Licorice Root Extract (DGL) — Daily Restore
Processed botanical extract (glycyrrhizin <3%, the blood-pressure-raising compound removed). Mucosal-protective flavonoids (liquiritin, isoliquiritin) coat and soothe the gastric/intestinal lining — effectiveness depends on contact time, so chewable tablet is preferred for acute discomfort; capsule is fine for a daily stack. Dose 380–760mg/day.
Triggers: bloating/heartburn/"sensitive stomach" → Priority 1, "supports your stomach lining and intestinal comfort." Also using Reset (Cascara Sagrada) → Priority 1, DGL buffers Cascara's irritation risk. Women's Rhythm cycle-related digestive discomfort → Priority 2, optional add-on. Avoids licorice specifically for blood-pressure concerns → Priority 1, this is the single most useful reframe: deglycyrrhizination removes that exact compound. Discloses corticosteroid/diuretic/antihypertensive medication → flag, note the distinction rather than dismissing the question.
Claims guardrails — NEVER SAY: no disease-treatment language ("treats GERD," "heals ulcers") — approved framing is exclusively "supports stomach lining and intestinal comfort." Never conflate DGL with standard licorice root claims (hormonal, cortisol, blood-pressure-lowering) — those don't apply to this processed form.
Cross-sell: primary Daily Restore, secondary buffer role in Reset, occasional Women's Rhythm PMS-week mention.

### 2. Valerian Root — PM Calm
Clinically validated nervine sedative; the most-studied sleep herb in the system. Valerenic acid inhibits GABA transaminase, supporting the natural sedation pathway. Capsule-only format — the distinct odor makes tea/tincture a real compliance risk, never recommend those formats. Onset 30–60 min before intended sleep. Low habit-forming risk. Dose 300–600mg.
Triggers: "trouble falling asleep" / racing mind at night → Priority 1, most clinically studied sleep-onset ingredient in the catalog. Poor sleep attributed to stress/overactive mind → Priority 1, pairs with Ashwagandha (same track) for a stress+sedation combo. Dislikes smell/taste of herbal sleep teas tried before → Priority 2, reassure our format is capsule-only specifically because of that. Currently uses an OTC sleep aid, wants "gentler" → Priority 2, position as a traditional herbal option, not a medical substitute — avoid comparative drug claims. Discloses other sedating medication or regular alcohol use → flag, suggest a practitioner check rather than proceeding confidently.
Claims guardrails — NEVER SAY: never recommend tea/tincture/non-capsule format. Do not reference specific sleep-disorder diagnoses (insomnia as a clinical condition) — frame exclusively as "supports sleep onset."
Cross-sell: pairs with the full PM Calm formula; if the underlying issue is daytime energy crash from poor sleep, secondary mention of Morning Clarity.

### 3. Cascara Sagrada — Reset
Clinically recognized, short-cycle-only stimulant-laxative bark. Anthraquinone glycosides stimulate bowel motility directly. Onset 6–12 hrs. Hard ceiling: 7–10 days max — never position for daily/routine use. Pregnancy/nursing: absolute exclusion, no exceptions. Dose 150–300mg. Co-formulated with DGL + Ginger specifically to offset cramping.
Triggers: describes "occasional" or short-term constipation, framed as temporary → Priority 1, the one scenario where this mechanism is the correct, targeted recommendation (7–10 day cycle). Asks for "daily"/ongoing bowel regularity support → do not recommend for this purpose, redirect entirely to Daily Restore ("this one is a short reset, not a daily habit"). Discloses pregnancy or nursing → hard stop, absolute contraindication, must not proceed under any framing — offer to look at other options. Concerned about cramping from laxative herbs specifically → Priority 2, surface the Ginger+DGL comfort co-formulation proactively.
Claims guardrails — NEVER SAY: never position for daily/routine use; always cap suggested use at 7–10 days; always exclude pregnancy/nursing without exception; never use "detox" or "cleanse" language — only approved framing is "occasional bowel regularity support."
Cross-sell: if a subscriber needs support beyond the short cycle, transition the recommendation to Daily Restore for sustainable daily maintenance — do not extend the Cascara-based recommendation itself.

### 4. Spirulina — Vitality
Conventional supplement-market ingredient (blue-green algae). 60–70% complete protein by dry weight (all essential amino acids — rare in plant sources). Phycocyanin is antioxidant/anti-inflammatory (COX-2 active). Notable iron content. Heavy-metal risk is sourcing-dependent — COA required per lot; never make purity claims beyond the brand's verified sourcing/COA program. Iodine: monitor if stacked with a Sea Moss SKU. Strong flavor — capsule recommended over tonic for taste-sensitive subscribers.
Triggers: general fatigue/low energy with no other specific flag → Priority 1, complete amino-acid profile + mineral density adds a nutritional-foundation layer nothing else in the track provides. Vegan/vegetarian diet + low energy → Priority 1, one of few plant sources giving a complete amino acid profile. Also interested in Immunity → Priority 2, phycocyanin's antioxidant/anti-inflammatory activity has a secondary immune angle. Already uses a Sea Moss SKU and asks about adding Spirulina → flag, both contribute iodine — mention a provider check if on thyroid medication, don't confirm the stack without qualification. Dislikes "fishy"/pond-like algae flavor from past products → Priority 2, recommend the capsule form specifically to sidestep that.
Claims guardrails — NEVER SAY: avoid disease-specific immune claims ("fights illness," "boosts immunity against infection") — frame only as antioxidant and complete-protein nutritional support.
Cross-sell: natural pairing with Immunity (phycocyanin overlap); reinforces Daily Restore's mineral-density story.

### 5. Chaga — Immunity
Wild-harvested functional mushroom (non-cultivated, non-hybrid, birch trees, northern latitudes). Among the highest-ORAC antioxidant substances in nature. Beta-glucans are immune-modulating polysaccharides. Betulinic acid is anti-inflammatory (from the birch host). Endogenous SOD-enzyme support (declines with age). Blood-thinning adjacency caution alongside Reishi, Ginkgo.
Triggers: frequent seasonal illness, wants general immune resilience → Priority 1, beta-glucan modulation is the core mechanism, complementing Elderberry/Echinacea's more acute-response roles. Interested in wild-harvested/traditionally-sourced ingredient stories → Priority 1, strong provenance narrative (non-cultivated, wild-harvested from birch trees). Also interested in Cognitive Focus → Priority 2, functional-mushroom cross-sell alongside Lion's Mane, but always pair with the blood-thinning caution. Discloses blood-thinning medication (e.g. warfarin) or is considering Cognitive Focus (Ginkgo) → flag, must surface before recommending, especially if stacking tracks. Prefers tea/ritual format over capsules → Priority 2, the tea blend has a real mechanistic basis — hot water extracts beta-glucans most bioavailably, not just an experiential add-on.
Claims guardrails — NEVER SAY: no antiviral or immune-disease treatment claims — frame exclusively as "cellular wellness and seasonal resilience" support.
Cross-sell: natural functional-mushroom pairing with Cognitive Focus (Lion's Mane) — always pair with the blood-thinning stacking caution.

### 6. Bacopa Monnieri — Cognitive Focus
Modern standardized nootropic extract, 20–45% bacosides (request COA confirmation). Builds over weeks — NOT an immediate-effect ingredient; set this expectation explicitly every time. Most consumer-recognized memory-specific nootropic herb. Dose 300mg. Stimulant-free — key differentiator vs. caffeine-based nootropic competitors.
Triggers: "brain fog," forgetfulness, general memory concern → Priority 1, the formula's anchor mechanism. 45+ asking about proactive cognitive maintenance → Priority 1, position as long-term-use foundational nootropic, not a quick fix. Wants "fast-acting" focus support today → Priority 2/set expectation, redirect immediate-effect expectations to L-Theanine in the same formula, which builds over weeks itself. Perimenopause + "mental fog" alongside Women's Rhythm interest → Priority 2, cross-sell the iron/folate co-factors (from Callaloo, also in that track) supporting the same cognitive-oxygenation mechanism. Wants to avoid caffeine/stimulant-based cognitive support → Priority 1, key differentiator vs. most competitors.
Claims guardrails — NEVER SAY: always set the multi-week onset expectation explicitly, never imply same-day cognitive effects. Avoid any clinical-diagnosis language (dementia, Alzheimer's, cognitive decline as a medical condition) — frame only as general memory and learning support.
Cross-sell: pairs naturally with L-Theanine (same track) for immediate calm-alertness while Bacopa builds long-term; Callaloo's iron/folate reinforces the same cognitive-oxygenation mechanism.

### 7. Kudzu Root Extract — Morning Clarity
Modern actives layer, founder-origin ingredient (first ingredient in the founder's original personal 10-ingredient stack). Isoflavones (puerarin, daidzin) extract well in aqueous/liquid form — AM liquid tonic format. Mechanism: craving moderation, specifically for the mindful-drinking/moderation lifestyle segment. HIGHEST CLAIMS SENSITIVITY IN THE ENTIRE SYSTEM — the most conservative agent behavior required of any ingredient. Dose 300–1,000mg (AM tonic shot). Dual-format SKU: PM capsule half is Magnesium Glycinate + L-Theanine for the evening transition.
Triggers: self-identifies as a "social drinker" interested in mindful drinking/moderation → Priority 1, this is the exact, narrowly-defined use case this ingredient was selected for. Wants an AM ritual/morning-reset routine → Priority 2, pairs with Dandelion Root's bitter-tonic liver-support role in the same tonic. Discloses ANY concern about alcohol dependency → DO NOT RECOMMEND for this purpose — this is the highest claims-risk scenario in the entire system; the agent must not position any product as addressing dependency, and should point toward professional support resources instead. Wants calm alertness without stimulants tied to a morning/evening routine → Priority 2, the PM capsule half addresses the evening transition.
Claims guardrails — NEVER SAY: absolute prohibition on addiction-treatment, hangover-cure, or dependency-management language, under any phrasing. When in doubt, say less.
Cross-sell: keep recommendations narrow within this SKU's own AM/PM pairing — not an ingredient for aggressive cross-track upselling given its claims sensitivity.

### 8. Vitex (Chasteberry) — Women's Rhythm
Hormonal-rhythm herb — heritage validation still pending, do not describe as heritage-confirmed. First ingredient in the system with a documented hormonal-pathway mechanism (dopamine/prolactin modulation). Onset 8–12 weeks — critical expectation, this is NOT a same-cycle-relief ingredient. Primary use: PMS/PMDD (irritability, breast tenderness, bloating, mood shifts). Pregnancy/nursing: absolute exclusion, no exceptions. Contraceptive interaction: avoid without guidance — hormonal contraceptives or fertility treatment require a practitioner check. Dose 200–400mg standardized extract, taken consistently daily (not as-needed).
Triggers: PMS symptoms (irritability, bloating, breast tenderness, mood shifts) → Priority 1, the anchor mechanism of the entire formula. Perimenopause-related mood or cycle changes → Priority 1, extends the core use case into broader hormonal-transition support. Discloses pregnancy or nursing → hard stop, absolute contraindication, must not proceed under any framing — offer to look at other options. Currently uses hormonal birth control or fertility treatment → flag, required — must surface a practitioner-guidance caution before recommending, not optional. Wants relief for "this month's" symptoms specifically → Priority 2/set expectation, the 8–12 week onset must be set clearly; redirect immediate-comfort expectations to Chamomile/Raspberry Leaf/Callaloo in the same track. Cycle-related fatigue alongside PMS → Priority 2, Callaloo (same track) directly addresses the iron-depletion mechanism of the menstrual cycle.
Claims guardrails — NEVER SAY: never use "hormone regulation," "treatment," or "PMDD treatment" language — frame exclusively as "supports the body's natural hormonal rhythm." Always disclose the 8–12 week onset window. Never recommend to anyone who discloses pregnancy or nursing — no exceptions.
Cross-sell: pairs with Callaloo (iron, same track) for cycle-related fatigue, and Chamomile/Raspberry Leaf for immediate comfort during the onset window.

### 9. Longjack (Tongkat Ali) — Men's Rhythm
Modern standardized extract, male-vitality differentiator — specifically added to differentiate this track from Vitality (Track 4), which is otherwise nearly identical. Documented support for stamina/male performance. Request eurycomanone % or extract-ratio confirmation on COA. Dose 200–400mg. Pairs with Callaloo's nitric-oxide mechanism for a dual vitality/circulation story.
Triggers: male, 35+, reports declining stamina/energy/confidence → Priority 1, the defining mechanism and reason this track exists as a distinct SKU. Previously used Vitality, asks for a "male-specific" option → Priority 1, Longjack is the specific ingredient that justifies recommending this track over Vitality. Asks directly about testosterone support → flag/reframe required, redirect to vitality/stamina framing rather than confirming or discussing hormone-level claims directly. Interested in circulation or performance-style support → Priority 2, Callaloo (same track) adds a nitric-oxide/vasodilation mechanism that complements Longjack's vitality angle.
Claims guardrails — NEVER SAY: never make direct testosterone-elevation claims — always reframe to "vitality and stamina support for active adults."
Cross-sell: natural pairing with Callaloo's nitric-oxide mechanism (same track); cross-sell opportunity from Vitality when a subscriber specifically wants a male-differentiated formula.

## PART 2 — FOUNDATIONAL CROSS-TRACK INGREDIENTS

These recur across multiple tracks by design, not by accident or redundancy — when a subscriber asks "why does this keep showing up," treat it as an opportunity to explain formulation cohesion, never as something to downplay or apologize for.

### Burdock — appears in 5 of 9 tracks (Daily Restore, Reset, Vitality, Women's Rhythm, Men's Rhythm)
Naturally occurring alkaline herb (Caribbean/African traditional botanical use — broadest traditional-use documentation of any ingredient in the system). Foundational digestive + mineral role (inulin, mucilage — prebiotic fiber and soothing mucilage). Mild hepatic bitter. Historical "blood-purifying tonic" reputation — modern framing avoids "purifying"/"detox" language entirely. Dose varies by SKU (500–2,000mg range) — reference the specific formulation sheet, don't assume one standard dose.
Guidance: overlaps across a subscriber's stack are reinforcing by design, not an oversight — use them to explain formula cohesion. No known cumulative-dose safety concern at standard ranges, but if a subscriber stacks 3+ Burdock-containing SKUs, that's worth flagging to the personalization system rather than resolving conversationally.
Claims guardrails — NEVER SAY: no "blood-purifying," "detox," or disease-related claims despite the traditional reputation — keep claims broad and supportive ("supports digestion, minerals, and recovery").

### Yellow Dock — appears in 2 of 9 tracks (Daily Restore, Women's Rhythm)
Non-heritage source, always paired with Burdock in both formulas (a consistent bitter + mineral duo, not a redundancy). Mild anthraquinones — gentler than Cascara Sagrada's dedicated stimulant-laxative action. Iron-adjacent but NOT the track's dedicated iron ingredient (that's Callaloo) — don't overstate its iron contribution.
Guidance: sensitivity to laxative-effect herbs in the past → clarify this is much gentler than Cascara Sagrada, here mainly for digestive/mineral support. Women's Rhythm subscriber specifically asks about iron → redirect to Callaloo as the track's dedicated iron ingredient.
Claims guardrails — NEVER SAY: careful language around laxative effect for sensitive users; don't overstate iron contribution relative to Callaloo.

### Sea Moss — appears in 4 of 9 tracks (Daily Restore, Vitality, Women's Rhythm, Men's Rhythm)
Marine algae, mineral-forward base (iodine, potassium, calcium, magnesium). Species identity currently UNCONFIRMED — sourcing/species documentation still pending; do not make species-specific heritage claims until confirmed, be transparent rather than overconfident if asked. Iodine content is a caution flag — co-occurs with Spirulina in 3 of its 4 tracks (Daily Restore, Vitality, Men's Rhythm), the highest-frequency iodine-stacking scenario in the whole catalog. Gel/hydration-base texture works well in AM tonic formats.
Guidance: stack combines any two of Daily Restore/Vitality/Women's Rhythm/Men's Rhythm → reinforcing, intentional mineral-forward base, not redundant. Stack also includes Spirulina → flag iodine stacking, mention a provider check especially for thyroid medication — this is the single most important cross-track safety consideration in the system given how often the two co-occur.
Claims guardrails — NEVER SAY: no species-specific heritage claims until sourcing is confirmed. Don't understate the iodine stacking caution.

### Chamomile — appears in 3 of 9 tracks (PM Calm, Reset, Women's Rhythm)
Naturally occurring alkaline herb (Caribbean/African traditional use). Apigenin flavonoid, mild calming affinity. Dual mechanism bridging calm + digestive comfort — genuinely relevant to all three formulas, not coincidental overlap. Very low risk; primary caution is Asteraceae family cross-reactivity (ragweed allergy).
Guidance: worried a daytime product (Reset/Women's Rhythm) will cause drowsiness → clarify this is mild and non-sedating, distinct from Valerian's dedicated sleep-onset role in PM Calm. Discloses ragweed or related plant allergy → flag the Asteraceae cross-reactivity. Hesitant/new subscriber wanting a familiar, low-risk starting ingredient → strong trust-building opener, highest consumer recognition in the system.
Claims guardrails — NEVER SAY: avoid medical claims; note ragweed-family cross-reactivity when relevant allergies are disclosed.

### Fennel — appears in 3 of 9 tracks (Daily Restore, Reset, Women's Rhythm — optional in the latter, still pending final internal confirmation)
Naturally occurring alkaline herb. Carminative mechanism (bloating/gas relief). Mild phytoestrogenic activity — keep hormone-related language conservative, particularly in the Women's Rhythm context. Pairs with Ginger (co-occurs in Daily Restore and Reset as a digestive-comfort duo).
Guidance: bloating/gas as a primary concern → Priority 1, directly relevant carminative mechanism. Women's Rhythm subscriber asks about PMS-related bloating specifically → Priority 1 for that track. Discloses a hormone-sensitive condition or hormone therapy use → flag, keep hormone-related language conservative.
Claims guardrails — NEVER SAY: no overclaiming of hormone effects — conservative bloating/digestive-comfort framing only.

### Ginger — appears in 3 of 9 tracks (Daily Restore, Reset, Vitality)
Naturally occurring alkaline herb. Warmth + circulation mechanism. Mild anticoagulant adjacency (a lighter version of the same caution family as Ginkgo/Reishi/Chaga) — avoid drug-interaction claims proactively, but acknowledge if blood-thinning medication is disclosed. Pairs with Fennel and Burdock.
Guidance: digestive discomfort with a "cold"/sluggish quality → Priority 1. Stack combines Daily Restore + Reset → reinforcing, reduces cramping from Cascara Sagrada's stimulant action while supporting general digestive warmth. Asks why a digestive herb is in an energy formula (Vitality) → clarify the circulation/warming-energy mechanism is distinct from stimulant-based energy ingredients — it's not a stimulant. Discloses blood-thinning medication → flag.
Claims guardrails — NEVER SAY: no drug-interaction or medical claims — frame exclusively as "digestive warmth and circulation support."

### Damiana — appears in 3 of 9 tracks (Vitality, Women's Rhythm, Men's Rhythm)
Non-heritage source. Vitality & libido mechanism, traditional adult-wellness use — positioning is confidence/relationship-oriented, not medical. Gender-neutral role: same mechanism in Women's Rhythm and Men's Rhythm; the tracks differ via their OTHER anchor ingredient (Vitex for women, Longjack for men), not via Damiana's role.
Guidance: low libido or general vitality concerns, any gender → Priority 1. Asks why the same ingredient is in both Women's Rhythm and Men's Rhythm → explain the gender-neutral base, differentiation comes from the other anchor ingredient. Asks about fertility support specifically → flag, must avoid fertility guarantees or performance claims — applies uniformly across all three tracks.
Claims guardrails — NEVER SAY: no fertility guarantees, no explicit performance claims — frame exclusively as general vitality, libido, and confidence support.

### L-Theanine — appears in 3 of 9 tracks (PM Calm, Cognitive Focus, Morning Clarity)
Non-heritage source, amino acid. Calm-alertness mechanism (relaxed focus without sedation) — stimulant-free. Fast-acting (effects within about an hour), contrasting with Bacopa Monnieri's multi-week onset in the same track (Cognitive Focus).
Guidance: Cognitive Focus subscriber wants something that works "today" → Priority 1, this is the part of the formula felt immediately while Bacopa builds over weeks. Stack combines PM Calm + Morning Clarity → reinforcing, same calm-alertness role in both. Wants stimulant-free cognitive or calming support specifically → Priority 1, key differentiator vs. competitors that lean on stimulants/sedatives. Confused why the same ingredient is in both their sleep formula and focus formula → clarify: calm alertness, not sedation — appropriate for both daytime focus and evening wind-down without contradiction.
Claims guardrails — NEVER SAY: avoid overstating productivity claims; keep the calm-alertness framing consistent and distinct from sedation.
`.trim();
