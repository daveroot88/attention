/* =====================================================================
   Prometheus - personality instrument
   ---------------------------------------------------------------------
   Structure follows the Big Five Aspect Scales taxonomy (DeYoung, Quilty
   & Peterson, 2007): 5 factors x 2 aspects = 15 reported dimensions.
   The taxonomy is published academic methodology and is used as such.

   Every item below and every line of narrative copy in this file is
   originally authored for Prometheus. Nothing is copied from Understand
   Myself, from the BFAS instrument itself, or from any other product.
   This is the SEC-10 constraint in 01-PRD.md and it is not negotiable.

   Scoring is deterministic arithmetic, no model call, per TECH-02.
   ===================================================================== */

const P_SCALE = [
  "Strongly disagree", "Disagree", "Neither", "Agree", "Strongly agree"
];

/* Aspect definitions. `f` is the parent factor. */
const P_ASPECTS = {
  compassion:     { f: "agreeableness",     label: "Compassion" },
  politeness:     { f: "agreeableness",     label: "Politeness" },
  industriousness:{ f: "conscientiousness", label: "Industriousness" },
  orderliness:    { f: "conscientiousness", label: "Orderliness" },
  enthusiasm:     { f: "extraversion",      label: "Enthusiasm" },
  assertiveness:  { f: "extraversion",      label: "Assertiveness" },
  withdrawal:     { f: "neuroticism",       label: "Withdrawal" },
  volatility:     { f: "neuroticism",       label: "Volatility" },
  intellect:      { f: "openness",          label: "Intellect" },
  aesthetics:     { f: "openness",          label: "Openness to Experience" }
};

const P_FACTORS = {
  agreeableness:     { label: "Agreeableness",     aspects: ["compassion", "politeness"] },
  conscientiousness: { label: "Conscientiousness", aspects: ["industriousness", "orderliness"] },
  extraversion:      { label: "Extraversion",      aspects: ["enthusiasm", "assertiveness"] },
  neuroticism:       { label: "Neuroticism",       aspects: ["withdrawal", "volatility"] },
  openness:          { label: "Openness",          aspects: ["intellect", "aesthetics"] }
};

/* 100 items, 10 per aspect. k = +1 keyed with the aspect, -1 reverse keyed. */
const P_ITEMS = [
  /* --- Compassion --- */
  { a: "compassion", k:  1, t: "I notice quickly when someone is upset." },
  { a: "compassion", k:  1, t: "I feel other people's disappointment almost as if it were my own." },
  { a: "compassion", k: -1, t: "Other people's problems are not my responsibility." },
  { a: "compassion", k:  1, t: "I go out of my way to comfort someone having a hard day." },
  { a: "compassion", k: -1, t: "I find it hard to care much about the misfortunes of strangers." },
  { a: "compassion", k:  1, t: "People tell me things they would not tell most people." },
  { a: "compassion", k: -1, t: "I would rather fix a problem than sit with someone who is hurting." },
  { a: "compassion", k:  1, t: "I take a genuine interest in how the people around me are doing." },
  { a: "compassion", k: -1, t: "I keep a professional distance from other people's feelings." },
  { a: "compassion", k:  1, t: "I am moved by stories about people I will never meet." },

  /* --- Politeness --- */
  { a: "politeness", k:  1, t: "I avoid saying things that would embarrass someone." },
  { a: "politeness", k: -1, t: "I push back hard when I am confident I am right." },
  { a: "politeness", k:  1, t: "I wait my turn even when I am impatient." },
  { a: "politeness", k: -1, t: "I can be blunt to the point of rudeness." },
  { a: "politeness", k:  1, t: "I give ground to people who feel strongly about something." },
  { a: "politeness", k: -1, t: "I am willing to apply pressure to get the outcome I want." },
  { a: "politeness", k:  1, t: "I dislike making anyone feel cornered." },
  { a: "politeness", k: -1, t: "I enjoy an argument more than most people do." },
  { a: "politeness", k:  1, t: "I let small slights go rather than raise them." },
  { a: "politeness", k: -1, t: "I will take advantage of an opening in a negotiation." },

  /* --- Industriousness --- */
  { a: "industriousness", k:  1, t: "I finish what I start." },
  { a: "industriousness", k: -1, t: "I put off work that I find boring." },
  { a: "industriousness", k:  1, t: "I keep going after the interesting part is over." },
  { a: "industriousness", k: -1, t: "I waste more time than I would like to admit." },
  { a: "industriousness", k:  1, t: "I set targets for myself and hit them." },
  { a: "industriousness", k: -1, t: "I need a deadline in front of me before I get moving." },
  { a: "industriousness", k:  1, t: "I work steadily rather than in bursts." },
  { a: "industriousness", k: -1, t: "I abandon projects partway through." },
  { a: "industriousness", k:  1, t: "People rely on me to carry something all the way to the end." },
  { a: "industriousness", k: -1, t: "I struggle to make myself start a difficult task." },

  /* --- Orderliness --- */
  { a: "orderliness", k:  1, t: "I like everything in its place." },
  { a: "orderliness", k: -1, t: "My workspace is usually a mess." },
  { a: "orderliness", k:  1, t: "I follow a routine most days." },
  { a: "orderliness", k: -1, t: "I leave things half organised." },
  { a: "orderliness", k:  1, t: "I keep lists and I keep them current." },
  { a: "orderliness", k: -1, t: "I am relaxed about schedules." },
  { a: "orderliness", k:  1, t: "I notice immediately when something is out of order." },
  { a: "orderliness", k: -1, t: "I lose track of small details." },
  { a: "orderliness", k:  1, t: "I plan the week before it starts." },
  { a: "orderliness", k: -1, t: "I would rather improvise than prepare." },

  /* --- Enthusiasm --- */
  { a: "enthusiasm", k:  1, t: "I am quick to laugh." },
  { a: "enthusiasm", k: -1, t: "I keep to myself in a group." },
  { a: "enthusiasm", k:  1, t: "I make friends easily." },
  { a: "enthusiasm", k: -1, t: "I find small talk draining." },
  { a: "enthusiasm", k:  1, t: "I show what I am feeling." },
  { a: "enthusiasm", k: -1, t: "I stay reserved with people I have just met." },
  { a: "enthusiasm", k:  1, t: "I enjoy being around a lot of people." },
  { a: "enthusiasm", k: -1, t: "I need a long stretch of time alone to recharge." },
  { a: "enthusiasm", k:  1, t: "I get visibly excited about things." },
  { a: "enthusiasm", k: -1, t: "People find me hard to read." },

  /* --- Assertiveness --- */
  { a: "assertiveness", k:  1, t: "I take charge when nobody else does." },
  { a: "assertiveness", k: -1, t: "I wait for someone else to speak first." },
  { a: "assertiveness", k:  1, t: "I say what I want directly." },
  { a: "assertiveness", k: -1, t: "I hold my opinion back in a group." },
  { a: "assertiveness", k:  1, t: "I am comfortable being the one out in front." },
  { a: "assertiveness", k: -1, t: "I find it hard to ask for what I need." },
  { a: "assertiveness", k:  1, t: "I set the direction when a group is stuck." },
  { a: "assertiveness", k: -1, t: "I would rather let others make the decision." },
  { a: "assertiveness", k:  1, t: "I speak with conviction." },
  { a: "assertiveness", k: -1, t: "I go quiet when the room gets loud." },

  /* --- Withdrawal --- */
  { a: "withdrawal", k:  1, t: "I worry about things that have not happened." },
  { a: "withdrawal", k: -1, t: "I stay calm under pressure." },
  { a: "withdrawal", k:  1, t: "I get discouraged easily." },
  { a: "withdrawal", k: -1, t: "I recover quickly from a setback." },
  { a: "withdrawal", k:  1, t: "I dwell on mistakes long after they stop mattering." },
  { a: "withdrawal", k: -1, t: "I rarely feel anxious." },
  { a: "withdrawal", k:  1, t: "I second guess decisions I have already made." },
  { a: "withdrawal", k: -1, t: "I feel confident in uncertain situations." },
  { a: "withdrawal", k:  1, t: "I expect things to go wrong." },
  { a: "withdrawal", k: -1, t: "I am hard to rattle." },

  /* --- Volatility --- */
  { a: "volatility", k:  1, t: "My mood changes quickly." },
  { a: "volatility", k: -1, t: "I keep an even temper." },
  { a: "volatility", k:  1, t: "I get irritated over small things." },
  { a: "volatility", k: -1, t: "I am slow to anger." },
  { a: "volatility", k:  1, t: "I say things in the moment that I later regret." },
  { a: "volatility", k: -1, t: "I stay steady when the people around me are upset." },
  { a: "volatility", k:  1, t: "I feel frustration rise fast." },
  { a: "volatility", k: -1, t: "I let things roll off me." },
  { a: "volatility", k:  1, t: "I need time to cool down after an argument." },
  { a: "volatility", k: -1, t: "My reactions are proportionate to what caused them." },

  /* --- Intellect --- */
  { a: "intellect", k:  1, t: "I enjoy abstract ideas." },
  { a: "intellect", k: -1, t: "I avoid complicated problems." },
  { a: "intellect", k:  1, t: "I like working out how something actually works." },
  { a: "intellect", k: -1, t: "I find theoretical discussion tedious." },
  { a: "intellect", k:  1, t: "I pick up new concepts quickly." },
  { a: "intellect", k: -1, t: "I lose interest once a subject turns technical." },
  { a: "intellect", k:  1, t: "I ask questions until I genuinely understand." },
  { a: "intellect", k: -1, t: "I would rather be handed the answer than work it out." },
  { a: "intellect", k:  1, t: "I enjoy arguing about ideas." },
  { a: "intellect", k: -1, t: "I stick to what I already know." },

  /* --- Openness to Experience (Aesthetics) --- */
  { a: "aesthetics", k:  1, t: "I am moved by music, art, or landscape." },
  { a: "aesthetics", k: -1, t: "I do not really notice how things look." },
  { a: "aesthetics", k:  1, t: "I seek out unfamiliar experiences." },
  { a: "aesthetics", k: -1, t: "I prefer the familiar to the new." },
  { a: "aesthetics", k:  1, t: "I have a vivid imagination." },
  { a: "aesthetics", k: -1, t: "I rarely daydream." },
  { a: "aesthetics", k:  1, t: "I notice beauty in ordinary things." },
  { a: "aesthetics", k: -1, t: "Poetry and fiction leave me cold." },
  { a: "aesthetics", k:  1, t: "I like work that leaves room for invention." },
  { a: "aesthetics", k: -1, t: "I would rather follow a proven method than invent one." }
];

/* ---------------------------------------------------------------------
   Provisional norms.

   FR-05 asks for percentiles against a normative population. Prometheus
   has no normative sample yet (RISK-02 in the PRD). Rather than invent
   one and present it as real, the percentile here is computed against a
   stated provisional distribution: the theoretical centre of the scale,
   with a spread taken from the typical dispersion of 10-item Likert
   aspect scales. Every screen that shows a percentile says this out loud.

   When a real sample exists, replace P_NORM only. Nothing else changes.
   --------------------------------------------------------------------- */
const P_NORM = { mean: 30.0, sd: 6.2, source: "provisional", n: 0 };

/* Normal CDF, Abramowitz and Stegun 26.2.17. Deterministic, no model call. */
function pNormCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  let p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 +
          t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/* FR-06: nine qualitative bands. */
const P_BANDS = [
  { max:  3, label: "Exceptionally low",  key: "low"     },
  { max: 10, label: "Very low",           key: "low"     },
  { max: 25, label: "Low",                key: "low"     },
  { max: 40, label: "Moderately low",     key: "modlow"  },
  { max: 60, label: "Typical",            key: "typical" },
  { max: 75, label: "Moderately high",    key: "modhigh" },
  { max: 90, label: "High",               key: "high"    },
  { max: 97, label: "Very high",          key: "high"    },
  { max:101, label: "Exceptionally high", key: "high"    }
];
function pBand(pct) { return P_BANDS.find(b => pct < b.max) || P_BANDS[P_BANDS.length - 1]; }

/* ---------------------------------------------------------------------
   Narrative library. Original copy, written for Prometheus.
   Five bands of prose per aspect; the nine-band label is reported
   alongside so precision is not lost in the collapse.
   --------------------------------------------------------------------- */
const P_COPY = {
  compassion: {
    what: "How much you feel what other people are feeling, and how far you will go to act on it.",
    low: "You keep other people's emotions at arm's length. Their difficulties register as facts to be handled rather than feelings to be shared, which makes you steady in situations that overwhelm others and useful when a decision has to be made about a person rather than for them. The cost is that warmth has to be a deliberate act for you, and people who need to feel understood before they can move forward will not get that from you by default.",
    modlow: "You care, but at a distance you control. You will help when help is asked for and you are not easily pulled into someone else's crisis. People tend to describe you as fair rather than warm, and that description is usually accurate. Where this costs you is in the moments when someone needed you to notice without being told.",
    typical: "You feel for people roughly as much as most people do. You notice distress when it is visible, you respond when responding is appropriate, and you can put the feeling down afterwards. This is an unremarkable and genuinely useful place to sit: you are neither the person who misses the room nor the person the room exhausts.",
    modhigh: "You pick up on other people's states quickly and you find it hard to leave them alone once you have. People bring you things. That is a real asset and it is also a real load, because your attention gets spent on other people's problems before you have decided whether to spend it. The skill worth building is not caring less, it is choosing.",
    high: "You feel other people's states almost as directly as your own. This makes you unusually good at the work that requires someone to actually understand a person rather than process them, and it makes you a magnet for people in difficulty. The failure mode is not coldness, it is depletion, and it arrives quietly. Your version of discipline is deciding in advance what you will carry."
  },
  politeness: {
    what: "How much deference you extend by default, and how readily you push against someone else.",
    low: "You do not soften things. When you think someone is wrong you say so, and you are comfortable applying pressure to get an outcome you believe in. In a room full of people avoiding the real issue you are the one who names it, which is valuable and is not always thanked. The risk is that you spend goodwill faster than you notice, and some of the doors that close on you do so quietly.",
    modlow: "You are direct and you will hold a position under pressure. Confrontation does not frighten you, though you do not seek it out. People generally know where they stand with you. Watch for the situations where being right mattered less than the other person staying in the conversation.",
    typical: "You extend the ordinary courtesies and you will push back when something matters enough. You can hold a hard line and you can let something go, and you mostly pick correctly between them. There is not much to warn you about here.",
    modhigh: "You give ground readily and you dislike making anyone uncomfortable. That makes you easy to work with and it makes conflict, when it finally arrives, larger than it needed to be, because you tend to absorb several small frictions before addressing one. The practice worth having is raising things early, while they are still small enough to be boring.",
    high: "Your default is deference. You avoid cornering people, you let slights pass, and you find open conflict genuinely unpleasant. People trust you quickly. The cost is real and specific: you will accept terms you did not want, and you will do it smoothly enough that nobody, including you, notices at the time. Being liked and being taken seriously are not the same lever."
  },
  industriousness: {
    what: "How reliably you convert intention into finished work, especially after the interesting part ends.",
    low: "Starting is hard and finishing is harder. You do your best work under external pressure, which means the quality of your output depends heavily on the structure around you rather than the structure inside you. This is not a character verdict, it is a design constraint: you need deadlines, commitments to other people, and short cycles, and you should build them deliberately instead of hoping to want to work.",
    modlow: "You get things done, in bursts, usually with a deadline in view. Work that has no external forcing function tends to drift. The highest-return change available to you is not more discipline, it is smaller units of work with a visible edge.",
    typical: "You finish most of what you start and you procrastinate on roughly what most people procrastinate on. Your output is steady enough that people can plan around it without it being the thing they remark on.",
    modhigh: "You carry things to the end and people know it. Work gets routed to you because you are the one who closes it, and you are usually willing. The pressure this creates is real: your reliability is a resource other people spend, and you are the only one positioned to price it.",
    high: "You keep going long after the task stopped being interesting, which is the rarest and most economically valuable part of this trait. You finish. The two things to watch are that you will finish work that should have been abandoned, because stopping feels like failing, and that you tend to measure yourself against output in a way that leaves you nothing to stand on when output falls."
  },
  orderliness: {
    what: "How much structure you build around yourself, and how much disorder you can tolerate before it costs you.",
    low: "You improvise. Systems feel like overhead, plans feel like guesses, and you would rather keep your options open and handle things as they arrive. In fast-moving and ambiguous conditions this is an advantage. In anything with many small obligations it is expensive, because the things you drop are rarely the things you would have chosen to drop.",
    modlow: "You keep enough order to function and no more. You know roughly where things are. You will build a system when the pain gets loud enough, and it will be lighter than most people's. Fine, as long as you are honest about which obligations are actually being tracked and which are being remembered.",
    typical: "You keep a workable amount of structure. Some routine, some lists, a tolerable amount of mess. You are neither slowed by your own systems nor undone by their absence.",
    modhigh: "You plan ahead and you notice when things are out of place. Your reliability comes partly from the structure you build, and that structure genuinely works. The cost shows up when conditions change faster than your plan does, and in the friction of working with people whose tolerance for mess is higher than yours.",
    high: "Order is how you think, not just how you tidy. You plan the week before it starts, you notice the one thing out of place, and disorder registers as an actual irritant rather than a neutral fact. This makes you excellent at anything with many moving parts and a fixed standard. It makes you brittle when the plan has to be thrown out, and it can make the tidiness of a process feel like evidence that the process is right."
  },
  enthusiasm: {
    what: "How much you draw energy from people, and how visibly you run.",
    low: "You are self-contained. Groups cost you energy rather than supply it, you keep your reactions internal, and people find you hard to read. In work that rewards sustained solitary attention this is a straightforward advantage. Where it costs you is that people mistake reserve for indifference, and you will be left out of things nobody realised you wanted.",
    modlow: "You are selective about company and you do not perform your feelings. You are comfortable alone and you engage warmly with people you have chosen. Most misreadings of you happen in the first hour, which is worth knowing.",
    typical: "You enjoy people in ordinary amounts and you show what you feel in ordinary amounts. You can work a room and you can be glad when it ends.",
    modhigh: "You are warm, quick to laugh, and easy to be around. People read you accurately because you show them. You gain energy from company, which means the shape of your week matters more to your state than you might credit.",
    high: "You run visibly and you run on people. You make friends fast, you show what you feel, and a room tends to warm up when you enter it. Two things to hold: solitude is a skill you may not have practised, and the quality of your judgement is more mood-dependent than a more contained person's, which matters most on the days you feel best."
  },
  assertiveness: {
    what: "How readily you take the front of the room and state what you want.",
    low: "You wait. You let others set the direction and make the call, and you are often the person who saw the problem and did not say it. In a group with good leadership this costs nothing. In a group without it, your accurate read goes unspent. The practice is small and specific: say the thing once, early, without building up to it.",
    modlow: "You will speak when it matters enough, and you would rather someone else took the lead. You are more comfortable with influence than with authority. Watch for the meetings where the decision went a way you knew was wrong.",
    typical: "You take charge when it is yours to take and you are content to follow when it is not. You ask for what you need often enough that you mostly get it.",
    modhigh: "You state what you want and you step forward when the group is stuck. People look to you for direction because you supply it. The thing to watch is the difference between the room being quiet because everyone agrees and it being quiet because you are speaking.",
    high: "You take the front by default. You say what you want directly, you are comfortable being visible, and you set direction without waiting to be asked. This is command presence and it is genuinely scarce. Its cost is informational: strongly assertive people receive systematically less dissent, and the more effective you are the more expensive that becomes. You have to go and get the disagreement, because it will not come to you."
  },
  withdrawal: {
    what: "How much of your attention goes to what could go wrong, and how long a setback stays with you.",
    low: "You are hard to rattle. Uncertainty does not read as threat, setbacks do not follow you home, and you make decisions in conditions that stall other people. The blind spot is symmetrical to the strength: threats that deserve worry get the same shrug as the ones that do not, and you may need someone else in the room whose job is to be nervous.",
    modlow: "You worry a normal amount less than most. You recover from setbacks quickly and you are steady when things are uncertain. This is a good place to be. Just make sure your calm is coming from a read of the situation rather than from not having looked.",
    typical: "You worry about roughly what there is to worry about. Setbacks land, and then they pass. You are neither the one holding the room together nor the one it has to be held together for.",
    modhigh: "You see what could go wrong, and you see it early. This makes you valuable in any process where somebody has to have thought about failure in advance. It also means a meaningful share of your attention is spent on futures that will not happen, and that setbacks stay with you past the point of usefulness. The distinction worth practising is between the worry that changes a decision and the worry that only reruns it.",
    high: "Anticipating what could go wrong is close to continuous for you, and mistakes stay with you long after they matter. There is a real capability inside this: you will have thought about the failure case while everyone else was enjoying the plan. But the cost is heavy and it compounds, because second-guessing decisions already made produces no new information and takes real time. Deciding what is done, and treating done as done, is the highest-leverage habit available to you."
  },
  volatility: {
    what: "How fast your state changes, and how much of it reaches other people.",
    low: "You are even. Your temper is slow, your reactions are proportionate, and you stay steady while people around you are not. This is quietly one of the most useful traits a person can have in a group under pressure. The only thing to check is whether steadiness is ever standing in for a reaction you needed to have and did not.",
    modlow: "You keep a level temper and things mostly roll off you. Irritation arrives and passes without much reaching the people around you.",
    typical: "Your mood moves in ordinary ways. You get irritated, you cool down, and the people around you can generally read where you are without it dominating the room.",
    modhigh: "Your state moves fast and it is visible. Frustration arrives quickly, and while it passes, it reaches other people on the way. The practical fix is almost entirely about the gap between feeling it and expressing it, because that is where the recoverable damage happens.",
    high: "Your mood changes quickly and it shows. Frustration rises fast, you say things in the moment that you would not say twenty minutes later, and you need real time to come down after conflict. The internal experience here is more taxing than it looks from outside, and the external cost lands on the people who are closest to you. Almost everything improves with one habit: not responding at the peak."
  },
  intellect: {
    what: "How much you enjoy ideas, abstraction, and working a problem out rather than being told.",
    low: "You are practical. Abstraction for its own sake does not appeal, and you would rather have a working answer than an interesting one. In execution-heavy work this is efficient. Where it costs you is at the point where the situation is genuinely new and the working answer is the wrong one, because that is exactly when the theoretical detour is worth taking.",
    modlow: "You engage with ideas when they lead somewhere and you lose patience when they do not. You would generally rather be given the answer and get on with it, which is often right and occasionally expensive.",
    typical: "You enjoy thinking things through without needing to. You will follow a technical explanation and you will also be content with the summary.",
    modhigh: "You like working out how things function and you ask questions until you actually understand. You pick up new concepts fast and you enjoy arguing about ideas. This is a genuine engine. The thing it does not supply is finishing, which is Industriousness, and the two are independent.",
    high: "Ideas are a source of pleasure for you, not just a tool. You go after understanding rather than answers, you are quick with new concepts, and you enjoy the argument itself. This is the trait that lets you get to the bottom of something nobody else could. It also makes it easy to spend a great deal of high-quality thinking on a question whose answer will not change anything, and to mistake having understood a problem for having done something about it."
  },
  aesthetics: {
    what: "How strongly you are drawn to beauty, novelty, and the imagined rather than the given.",
    low: "You are grounded in what is actually there. Novelty for its own sake does not pull at you and proven methods are more attractive than invented ones. This is reliable and it is unfashionable to say so. The cost is a narrower field of options: you will tend not to see the version of the thing that does not exist yet.",
    modlow: "You prefer the familiar and you notice aesthetics when they are pointed out. You would rather use a method that works than build one that might work better.",
    typical: "You appreciate beauty and novelty in ordinary measure. You will try the new thing when there is a reason to and you are not restless without it.",
    modhigh: "You are drawn to the unfamiliar and you notice how things look and feel. You like work with room for invention in it, and you will make room if there is not any. This is where original work comes from.",
    high: "Art, landscape, and imagination land on you with real force, and you actively seek out what you have not encountered before. You see the version of the thing that does not exist yet, which is the whole basis of original work. The cost is in the two places it always is: the familiar option that would have been fine gets rejected for being familiar, and the invented method absorbs time the proven one would not have."
  }
};

/* Factor-level framing, three bands. */
const P_FACTOR_COPY = {
  agreeableness: {
    low:  "You lead with your own read rather than with the room. You are willing to be the friction.",
    mid:  "You balance your own position against other people's without either one dominating.",
    high: "You orient towards other people first. Cooperation is your default rather than a decision."
  },
  conscientiousness: {
    low:  "You work off energy and interest rather than off structure. Output is high when engaged and unreliable when not.",
    mid:  "You are dependable without being rigid. Structure exists where it is needed and not everywhere.",
    high: "You are the person things get finished by. Duty and order are load-bearing parts of how you operate."
  },
  extraversion: {
    low:  "You are self-contained. Reward comes from the work rather than from the room.",
    mid:  "You move between company and solitude without much cost either way.",
    high: "You are energised and rewarded by people and by visible engagement."
  },
  neuroticism: {
    low:  "You are emotionally stable under load. Threat and setback do not stay with you.",
    mid:  "You feel pressure and you recover from it in ordinary time.",
    high: "You feel threat and setback strongly, and they persist. This is costly and it also means you see risk early."
  },
  openness: {
    low:  "You are practical and grounded. You trust what has been shown to work.",
    mid:  "You engage with new ideas without needing them.",
    high: "You are exploratory. Ideas and novelty are a source of energy, not just of information."
  }
};

/* FR-08: trait interactions. Each fires only when both conditions hold,
   because the interaction says something neither dimension says alone. */
const P_INTERACTIONS = [
  { id: "quiet-engine", need: [["assertiveness","low"],["industriousness","high"]],
    title: "Quiet engine",
    body: "You finish things and you do not announce it. The work is visible and you are not, which means credit for your output will be allocated by whoever is talking. This is the single most common way a genuinely high performer stays invisible, and it is fixed by reporting rather than by working harder." },
  { id: "anxious-perfectionist", need: [["withdrawal","high"],["orderliness","high"]],
    title: "Anxious order",
    body: "Structure is doing double duty for you. It organises the work and it manages the worry, which is why disruption to your systems costs you more than the disruption itself warrants. Worth knowing, because the reasonable-sounding case for keeping the plan will sometimes be the anxiety talking." },
  { id: "ideas-no-finish", need: [["intellect","high"],["industriousness","low"]],
    title: "Ideas without landing",
    body: "You understand more than you complete. These are independent traits and yours point in opposite directions, so the gap between what you can see and what you have shipped is wider than it is for most people. Nothing about this improves by understanding it better, which is exactly the trap." },
  { id: "warm-pushover", need: [["compassion","high"],["politeness","high"]],
    title: "Costly warmth",
    body: "You feel what people are feeling and you are reluctant to make them uncomfortable. Together those produce a person who absorbs cost silently and is well liked for it. The bill arrives late and all at once. Naming a limit early is not unkindness, it is the only version of this that is sustainable." },
  { id: "commanding-uninformed", need: [["assertiveness","high"],["politeness","low"]],
    title: "Room-clearing conviction",
    body: "You state your position directly and you do not soften it. The effect is that disagreement stops reaching you, which feels like agreement and is not. The more effective you become the more expensive this gets. You will have to solicit the objection explicitly, because it will not arrive on its own." },
  { id: "volatile-withdrawn", need: [["volatility","high"],["withdrawal","high"]],
    title: "Compounded load",
    body: "You feel setbacks strongly and you also express them fast. Each one makes the other harder to manage, because the reaction creates new material for the rumination. The intervention that works is temporal rather than emotional: delay the response, and handle the feeling separately from the situation that caused it." },
  { id: "explorer-executor", need: [["aesthetics","high"],["industriousness","high"]],
    title: "Invention that ships",
    body: "You go looking for the version that does not exist and you also finish things. That combination is uncommon enough to be worth naming as an asset rather than a description. The failure mode is scope: you will keep finding a better version of something already good enough to release." },
  { id: "steady-hand", need: [["withdrawal","low"],["volatility","low"]],
    title: "Steady under load",
    body: "Neither anticipated threat nor present frustration moves you much. In a group under pressure you are the stabiliser, whether or not that is your role on paper. The matching blind spot is that you will under-react to things that warranted a reaction, so treat other people's alarm as data rather than as noise." }
];
