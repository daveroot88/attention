/* =====================================================================
   Prometheus - AI engagement instrument
   ---------------------------------------------------------------------
   Behavioural structure follows the published 8-mode / 3-tier framework
   referenced in 01-PRD.md (FR-13, FR-14). The framework is used as a
   behavioural taxonomy. Every item, every target number, every archetype
   name and every line of feedback copy in this file is original to
   Prometheus, per SEC-10.

   The PRD's V1 ingestion path (FR-10 to FR-12) classifies a real
   transcript with a model call. This instrument is the self-report
   sibling of that: no transcript leaves the browser, no model is called,
   and the result is deterministic. It answers "how do I use AI" from
   what the person reports about themselves. Transcript ingestion is the
   next build, and the two share this scoring spine.
   ===================================================================== */

const A_SCALE = ["Never", "Rarely", "Sometimes", "Often", "Almost always"];

const A_MODES = {
  oracle:      { tier: "passivity",   label: "Oracle",
                 blurb: "You ask for the answer and you take it." },
  production:  { tier: "passivity",   label: "Production Assistant",
                 blurb: "You hand over the output and collect the result." },
  tutor:       { tier: "partnership", label: "Tutor",
                 blurb: "You ask it to teach you, not just to tell you." },
  collab:      { tier: "partnership", label: "Collaborative Problem-Solver",
                 blurb: "You think alongside it and the answer emerges between you." },
  verify:      { tier: "agency",      label: "Verification Agent",
                 blurb: "You check its work before you trust it." },
  expand:      { tier: "agency",      label: "Creative Expander",
                 blurb: "You use it to widen the option set, not to close it." },
  challenge:   { tier: "agency",      label: "Critical Challenger",
                 blurb: "You argue with it on purpose." },
  frame:       { tier: "agency",      label: "Problem Setter",
                 blurb: "You define the problem before you ask for anything." }
};

const A_TIERS = {
  passivity:   { label: "Passivity",   modes: ["oracle", "production"],
                 blurb: "Work moves out to the model and comes back finished." },
  partnership: { label: "Partnership", modes: ["tutor", "collab"],
                 blurb: "You and the model are both doing cognitive work." },
  agency:      { label: "Agency",      modes: ["verify", "expand", "challenge", "frame"],
                 blurb: "You are steering: framing, widening, testing, checking." }
};

/* 40 items, 5 per mode. Frequency scale, all keyed positive: a
   reverse-keyed item on a frequency scale measures a different mode
   rather than the absence of this one, which corrupts a distribution. */
const A_ITEMS = [
  /* --- Oracle --- */
  { m: "oracle", t: "I ask a question, read the answer, and move on." },
  { m: "oracle", t: "I take what it gives me without checking where it came from." },
  { m: "oracle", t: "I use it the way I would use a search engine that talks back." },
  { m: "oracle", t: "If the answer sounds right, that is enough for me." },
  { m: "oracle", t: "I ask it things I could work out myself, because it is faster." },

  /* --- Production Assistant --- */
  { m: "production", t: "I ask it to produce the finished thing rather than help me make it." },
  { m: "production", t: "I paste its output into the real document with light edits." },
  { m: "production", t: "I describe what I want and let it do the writing." },
  { m: "production", t: "I use it to get through volume work I do not want to do myself." },
  { m: "production", t: "I judge a session by how much finished output came out of it." },

  /* --- Tutor --- */
  { m: "tutor", t: "I ask it to explain something until I actually understand it." },
  { m: "tutor", t: "I ask why the answer is what it is, not just what the answer is." },
  { m: "tutor", t: "I ask it to walk me through the reasoning step by step." },
  { m: "tutor", t: "I ask follow-up questions about the parts I did not follow." },
  { m: "tutor", t: "I use it to learn something I will need again later." },

  /* --- Collaborative Problem-Solver --- */
  { m: "collab", t: "I think out loud with it and we get somewhere neither of us started." },
  { m: "collab", t: "I bring it a half-formed idea rather than a finished question." },
  { m: "collab", t: "I build on its response and it builds on mine." },
  { m: "collab", t: "The useful part of a session is usually several exchanges in." },
  { m: "collab", t: "I treat it as a thinking partner rather than a source." },

  /* --- Verification Agent --- */
  { m: "verify", t: "I check its claims against something outside the conversation." },
  { m: "verify", t: "I ask it for its sources and then actually look at them." },
  { m: "verify", t: "I test the output before I rely on it." },
  { m: "verify", t: "I assume there is an error in there somewhere and go looking." },
  { m: "verify", t: "I ask it to show its working so I can check it." },

  /* --- Creative Expander --- */
  { m: "expand", t: "I ask for several options rather than one recommendation." },
  { m: "expand", t: "I ask what I have not considered." },
  { m: "expand", t: "I use it to widen the field before I narrow it." },
  { m: "expand", t: "I ask for the unconventional version on purpose." },
  { m: "expand", t: "I keep going past the first workable idea." },

  /* --- Critical Challenger --- */
  { m: "challenge", t: "I ask it to argue against the position I just took." },
  { m: "challenge", t: "I push back when its answer is too agreeable." },
  { m: "challenge", t: "I ask it to find the weakest part of my reasoning." },
  { m: "challenge", t: "I deliberately give it the case for the other side." },
  { m: "challenge", t: "I treat a confident answer as something to attack." },

  /* --- Problem Setter --- */
  { m: "frame", t: "I spend real effort defining the problem before I ask anything." },
  { m: "frame", t: "I decide what a good answer would look like in advance." },
  { m: "frame", t: "I give it the constraints and the context before the question." },
  { m: "frame", t: "I notice when I am asking the wrong question and restate it." },
  { m: "frame", t: "I decide what the actual decision is before I open the chat." }
];

/* ---------------------------------------------------------------------
   Target distributions.

   FR-15 requires task-specific targets and states plainly that they must
   be independently derived rather than copied. These are Asch Capital's
   own v0.1 priors. They are reasoned, not fitted: there is no Prometheus
   outcome data yet to fit them to. Every screen that scores against them
   says so. STEP-12 replaces these with estimates from real data.

   Each row sums to 100.
   --------------------------------------------------------------------- */
const A_TASKS = {
  learn:    { label: "Learning something new",
              target: { oracle: 5,  production: 3,  tutor: 30, collab: 20, verify: 15, expand: 8,  challenge: 9,  frame: 10 } },
  write:    { label: "Writing or drafting",
              target: { oracle: 5,  production: 22, tutor: 6,  collab: 20, verify: 10, expand: 18, challenge: 9,  frame: 10 } },
  build:    { label: "Coding or building",
              target: { oracle: 8,  production: 20, tutor: 10, collab: 16, verify: 24, expand: 6,  challenge: 6,  frame: 10 } },
  decide:   { label: "Analysis or a decision",
              target: { oracle: 4,  production: 6,  tutor: 8,  collab: 18, verify: 22, expand: 12, challenge: 16, frame: 14 } },
  ideate:   { label: "Creative ideation",
              target: { oracle: 3,  production: 6,  tutor: 5,  collab: 22, verify: 6,  challenge: 12, expand: 34, frame: 12 } },
  routine:  { label: "Routine production work",
              target: { oracle: 14, production: 44, tutor: 4,  collab: 10, verify: 16, expand: 4,  challenge: 3,  frame: 5 } }
};

/* FR-16: expertise shifts the target rather than replacing it. A beginner
   is correctly more Tutor-weighted; an expert is correctly more able to
   delegate production and more obliged to verify. Multipliers are applied
   then renormalised to 100. Values are Prometheus's own, and provisional. */
const A_EXPERTISE = {
  beginner:     { label: "Beginner",
                  mult: { oracle: 1.0, production: 0.8, tutor: 1.6, collab: 1.1, verify: 0.9, expand: 0.9, challenge: 0.7, frame: 0.8 } },
  intermediate: { label: "Intermediate",
                  mult: { oracle: 1.0, production: 1.0, tutor: 1.0, collab: 1.0, verify: 1.0, expand: 1.0, challenge: 1.0, frame: 1.0 } },
  expert:       { label: "Expert",
                  mult: { oracle: 0.7, production: 1.3, tutor: 0.5, collab: 1.0, verify: 1.2, expand: 1.1, challenge: 1.3, frame: 1.3 } }
};

/* ---------------------------------------------------------------------
   Archetypes. Six, named by Prometheus. The PRD notes the source
   product's own two published lists disagree with each other, so nothing
   is inherited here.
   --------------------------------------------------------------------- */
const A_ARCHETYPES = {
  dispatcher: {
    label: "The Dispatcher",
    line: "You send work out and take delivery.",
    body: "Your sessions are transactions. You know what you want, you ask for it, and you use what comes back. That is genuinely efficient for work whose answer you could have checked yourself, and it is the riskiest possible posture for work whose answer you could not. The single change that would move you most is not using it less, it is deciding, before each session, which of those two kinds of task you are in."
  },
  apprentice: {
    label: "The Apprentice",
    line: "You use it to be taught.",
    body: "You ask for reasoning rather than conclusions and you follow up on what you did not understand. This compounds in a way that delegation does not, because the capability ends up in you rather than in the transcript. The gap to watch is verification: understanding an explanation and confirming it is correct are different acts, and the explanation is always the more persuasive of the two."
  },
  coauthor: {
    label: "The Co-Author",
    line: "You think with it, not at it.",
    body: "Your best sessions arrive several exchanges in, from a half-formed idea rather than a finished question. That is the mode most people never reach and it is where the model is most useful. What it does not supply is friction: a collaborator that builds on your idea will rarely tell you the idea is wrong. You have to ask for that separately."
  },
  auditor: {
    label: "The Auditor",
    line: "You check before you trust.",
    body: "You assume there is an error and you go looking for it, which puts you in a small minority and correctly so. The cost is throughput, and it falls hardest on low-stakes work where verification buys you nothing. Scaling your scrutiny to the consequence of being wrong would give you back real time without giving up anything that matters."
  },
  prospector: {
    label: "The Prospector",
    line: "You widen the field before you narrow it.",
    body: "You ask for options rather than answers, you go past the first workable idea, and you ask what you have not considered. That is where non-obvious answers come from. The matching risk is that the option set keeps growing and the decision keeps not happening. Deciding in advance how many options is enough turns this strength into finished work."
  },
  cartographer: {
    label: "The Cartographer",
    line: "You define the problem before you ask for anything.",
    body: "You do the expensive work first: constraints, context, what a good answer would look like. Most poor output is a framing failure rather than a model failure, and you have largely designed that out. The thing to watch is over-specification, where the frame is drawn so tightly that the only answers that fit are the ones you already had."
  }
};

/* Ordered: first matching rule wins. Thresholds are on the normalised
   actual distribution, not the raw scores. */
const A_ARCHETYPE_RULES = [
  { id: "cartographer", test: d => d.frame >= 16 },
  { id: "auditor",      test: d => d.verify >= 20 },
  { id: "prospector",   test: d => d.expand + d.challenge >= 26 },
  { id: "coauthor",     test: d => d.collab >= 18 },
  { id: "apprentice",   test: d => d.tutor >= 16 },
  { id: "dispatcher",   test: d => d.oracle + d.production >= 30 },
  { id: "coauthor",     test: () => true }
];

/* FR-21: exercises are task-driven, not personality-adaptive. V1 scope. */
const A_EXERCISES = {
  oracle: [
    "Before you accept the next answer, write down one thing that would have to be true for it to be wrong. Then check that one thing.",
    "Pick one question this week you would normally ask and answer it yourself first. Compare after."
  ],
  production: [
    "Take one piece of output you would normally paste in, and rewrite the opening yourself before you use the rest.",
    "Ask for the structure rather than the finished text, then fill it in. Same time, different result."
  ],
  tutor: [
    "On the next answer you accept, ask it to explain why that is the answer and not the nearest alternative.",
    "End one session this week by writing the explanation back in your own words, without looking."
  ],
  collab: [
    "Bring it something half-formed on purpose. No finished question, just the shape of the problem.",
    "On the next session, do not accept the first response as the answer. Build on it and see where the fourth exchange lands."
  ],
  verify: [
    "Ask for the sources on your next factual answer, then open one of them.",
    "Before you use the next output, name the single claim in it that would cost you most if it were wrong. Check that one."
  ],
  expand: [
    "Ask for five approaches before you evaluate any of them. Do not let it recommend.",
    "After you have your answer, ask what a person who disagreed with this approach would do instead."
  ],
  challenge: [
    "Take your next conclusion and ask it to make the strongest case against it.",
    "When the response agrees with you, say so, and ask what it is not telling you."
  ],
  frame: [
    "Before your next session, write one sentence: what decision is this for.",
    "Write down what a good answer would look like before you ask. If you cannot, that is the finding."
  ]
};
