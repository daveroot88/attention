/* =====================================================================
   Asch AI Operations - offer configuration
   ---------------------------------------------------------------------
   Structure is adapted from the three-stage services ladder Corey Ganim
   published on 2026-08-18 (free mini assessment -> paid assessment ->
   monthly concierge retainer, delivered on an audit / optimise /
   automate loop). The structure is his; the pricing, the copy, the
   positioning and the deliverables below are Asch Capital's.

   EVERY PRICE BELOW IS A PROPOSAL AND NEEDS DAVID'S SIGN-OFF BEFORE
   THIS GOES LIVE. They are anchored on Ganim's published bands
   (assessments $500-$2,000, retainers $1,200-$2,500/mo) and set at the
   upper end because Asch Capital is not selling into the same market.

   HOW BUYING WORKS
   ----------------
   Checkout is a URL. That is the whole design, and it is deliberate:
   whatever provider David wants to take money through, the button is a
   link to it, so no payment secret ever lives in this Worker and no card
   or bank detail ever touches aschcapital.com.

   Set PAYMENT.provider below and fill in the one field it needs. Until
   a provider is configured, every paid button renders as "Request an
   invoice" and posts to the enquiry endpoint instead, so nothing is
   ever broken in front of a customer.

   ===================================================================== */

/* ---------------------------------------------------------------------
   Payment provider.
   ---------------------------------------------------------------------
   "venmo"   Buttons deep-link to Venmo with the amount and a note
             pre-filled. Needs `venmo.handle`.
   "stripe"  Buttons link to a Stripe Payment Link. Needs a `link:` URL
             on each paid offer below.
   "none"    Everything falls back to "Request an invoice".

   READ THIS BEFORE SWITCHING TO VENMO
   -----------------------------------
   1. It has to be a Venmo BUSINESS profile. Venmo's user agreement does
      not permit taking payment for goods and services through a
      personal account, and the penalty is frozen funds and a closed
      account, which is a bad way to find out. Set `business: true` once
      the profile is actually a business profile.
   2. Venmo has no recurring billing. A monthly retainer cannot be set
      up to charge itself. The button pays the first month and every
      month after that is a request you send by hand. The card copy
      says this out loud rather than letting someone assume otherwise.
   3. Venmo is US only and the payer needs a Venmo account.
   --------------------------------------------------------------------- */
const PAYMENT = {
  provider: "venmo",         /* "venmo" | "stripe" | "none" */

  venmo: {
    handle: "David-Root-1",  /* confirmed by David 2026-08-24 */

    /* Documentation, not a switch. Nothing in the code reads it. It is
       here because point 1 above is the one that bites: if this account
       is still a personal profile, taking retainer payments through it
       is against Venmo's user agreement. Flip it when the profile has
       actually been converted. */
    business: false
  }
};

/* Builds the checkout URL for one offer, or null if nothing is
   configured yet. Kept here next to the config it reads. */
function payUrlFor(offer) {
  if (!offer || offer.kind !== "buy") return null;

  if (PAYMENT.provider === "stripe") return offer.link || null;

  if (PAYMENT.provider === "venmo") {
    const handle = (PAYMENT.venmo.handle || "").replace(/^@/, "").trim();
    if (!handle) return null;
    const note = "Asch Capital " + offer.name +
                 (offer.priceNote === "per month" ? " (first month)" : "");
    return "https://venmo.com/" + encodeURIComponent(handle) +
           "?txn=pay&amount=" + offer.price +
           "&note=" + encodeURIComponent(note);
  }
  return null;
}

/* The line under a buy button. It has to tell the truth about what
   pressing it does, which differs by provider. */
function payNoteFor(offer, hasUrl) {
  /* No usable checkout URL means the button is the invoice fallback,
     whatever the configured provider is. The line under it has to
     describe the button that is actually there. */
  if (!hasUrl) {
    return "Card checkout for this one is not switched on yet. Ask for an invoice and we will send it.";
  }
  if (PAYMENT.provider === "stripe") {
    return "Secure checkout on Stripe. Card details never touch this site.";
  }
  if (PAYMENT.provider === "venmo") {
    return offer.priceNote === "per month"
      ? "Opens Venmo for the first month, with the amount filled in. Venmo cannot bill on a schedule, so we send a request each month after that."
      : "Opens Venmo with the amount filled in. Nothing you enter there touches this site.";
  }
  return "Card checkout for this one is not switched on yet. Ask for an invoice and we will send it.";
}

const OFFERS = {
  currency: "USD",

  /* Stage 1. The door opener. Not a purchase. */
  mini: {
    id: "mini",
    stage: "Stage one",
    name: "The Fifteen",
    price: 0,
    priceLabel: "No charge",
    tagline: "Fifteen minutes. One bottleneck. One prescription.",
    body: "A short call on one process that is costing you time. We find the worst of it and tell you what we would do about it. You get the recommendation whether or not you ever buy anything else. We do not implement it on this call, and that boundary is the point: the plan is free, the build is not.",
    includes: [
      "One 15 minute call",
      "The three places work is piling up, ranked",
      "One specific fix, named, with the tool or workflow to use",
      "A five minute follow up with the written version"
    ],
    cta: "Book the fifteen",
    kind: "lead"
  },

  /* Stage 2. The paid diagnosis. This is the product that proves we can read a business. */
  assessment: {
    id: "assessment",
    stage: "Stage two",
    name: "The Operations Assessment",
    price: 1500,
    priceLabel: "$1,500",
    priceNote: "one time",
    tagline: "Every AI opportunity in your business, scored and ranked.",
    body: "Sixty minutes mapping how the work actually moves through your company, then a written assessment of every place AI changes the economics. Each opportunity is scored on impact against effort and ordered so the cheap wins come first. The ROI in the report is built from your numbers, not ours: you tell us what the bottleneck costs you in hours and what an hour of your time is worth, and the arithmetic is shown so you can argue with it.",
    includes: [
      "A 60 minute workflow mapping session",
      "Three to seven scored AI opportunities, impact against effort",
      "ROI stated with the assumptions visible and attributed to you",
      "A prioritised action plan in build order",
      "A 30 minute call to walk you through it"
    ],
    note: "This is an estimate of time value returned, not audited savings. Both inputs are yours. We show the working rather than producing a number after the call.",
    cta: "Buy the assessment",
    kind: "buy",
    link: ""   /* <- Stripe Payment Link URL goes here */
  },

  /* Stage 3. The retainer. This is where the business actually lives. */
  retainers: [
    {
      id: "operator",
      stage: "Stage three",
      name: "Operator",
      price: 1750,
      priceLabel: "$1,750",
      priceNote: "per month",
      tagline: "One workflow at a time, until the list runs out.",
      body: "Done with you, not done for you. Two calls a month, one process each, run on the same loop every time: watch how the work is done today, cut the steps that should not exist, then automate what is left. The person who owns the process is in the room for the build, which is the entire reason it gets used afterwards.",
      includes: [
        "Two 45 minute working sessions each month",
        "One scoped workflow improvement per session",
        "Voice message access between sessions, answered inside one business day",
        "The automation built with you on the call, not handed over as a black box",
        "Written SOP and team training for each process we finish"
      ],
      cta: "Start Operator",
      kind: "buy",
      link: ""   /* <- Stripe Payment Link URL goes here */
    },
    {
      id: "embedded",
      stage: "Stage three",
      name: "Embedded",
      price: 3000,
      priceLabel: "$3,000",
      priceNote: "per month",
      tagline: "For companies with more than one process worth fixing at once.",
      body: "The same loop, run at twice the cadence, with your team in the room rather than just the owner. Suited to businesses where the bottleneck is not one process but the fact that nobody has been given the time to look at any of them.",
      includes: [
        "Four 45 minute working sessions each month",
        "Up to two workflows in flight at a time",
        "Voice message access answered inside four business hours",
        "Team training sessions, not only owner training",
        "A quarterly written re-assessment as the operation changes"
      ],
      cta: "Start Embedded",
      kind: "buy",
      link: "",  /* <- Stripe Payment Link URL goes here */
      featured: true
    }
  ],

  /* The delivery loop, stated publicly because it is the reason the retainer works. */
  loop: [
    { k: "Audit",
      v: "You share your screen and show us the work as it is actually done. We write down every step and fix nothing yet." },
    { k: "Optimise",
      v: "Most processes carry steps that stopped being necessary years ago. Those come out before any automation goes in. Automating a bloated process only makes the bad version run faster." },
    { k: "Automate",
      v: "The cleaner process gets built into a reusable skill, with you driving during the call. Then we document it and train whoever else needs it." }
  ],

  /* Who this is for. Named plainly so unqualified buyers self-select out. */
  fit: {
    yes: [
      "Owner led, with the owner still close enough to the work to see the bottlenecks",
      "Roughly $3M to $50M in revenue",
      "Repetitive work that a person is currently doing by hand",
      "Someone who already believes AI matters and wants to know where to start"
    ],
    no: [
      "Companies looking for a vendor to hand the problem to entirely",
      "Teams wanting a custom software build rather than a change in how work is done",
      "Anyone who needs to be convinced that the manual work is a problem"
    ]
  },

  /* Boundaries, published. These are what keep the offer deliverable. */
  scope: [
    "The Fifteen ends at the recommendation. We do not build during it.",
    "Retainer calls are scheduled. More access is available and it is priced, not absorbed.",
    "We standardise on one delivery stack. We are not learning a new toolchain per client."
  ]
};

/* Where an enquiry goes when there is no Payment Link yet, and for The Fifteen. */
const OFFERS_ENDPOINT = "/api/ai-ops/enquiry";
