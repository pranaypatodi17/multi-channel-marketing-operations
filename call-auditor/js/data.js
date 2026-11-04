/* CallLens — seed data: rubric, agents, scripted call archetypes.
   Transcripts are scripted (Hinglish + English) for a fictional lender/insurer, "Anvaya Financial". */
(function () {
  'use strict';
  const CL = (window.CL = window.CL || {});

  CL.ORG = { name: 'Anvaya Financial', plan: 'Business', region: 'ap-south-1 (Mumbai)' };
  CL.USER = { name: 'Anjali Verma', role: 'Head of Sales QA', email: 'anjali.verma@anvayafinancial.example', initials: 'AV' };

  CL.CATEGORIES = ['Opening', 'Discovery', 'Product accuracy', 'Objection handling', 'Compliance', 'Tone and conduct', 'Closing'];

  /* ---------- Default rubric (client-editable) ---------- */
  CL.RUBRIC_DEFAULT = [
    { id: 'open_greet', name: 'Greeted properly and introduced self and company', category: 'Opening', type: 'scale', weight: 6, severity: 'minor', engine: 'AI', enabled: true,
      desc: 'Agent greets, states own name and company in the first turn.', flag: 'Weak opening' },
    { id: 'open_verify', name: 'Confirmed they were speaking to the right person', category: 'Opening', type: 'passfail', weight: 5, severity: 'minor', engine: 'AI', enabled: true,
      desc: 'Agent asks for / confirms the customer’s identity before discussing the product.', flag: 'Identity not confirmed' },
    { id: 'disc_needs', name: 'Asked about needs and budget before pitching', category: 'Discovery', type: 'scale', weight: 12, severity: 'minor', engine: 'AI', enabled: true,
      desc: 'Agent asks open questions about goals, current cover/investments and budget before recommending a product.', flag: 'Pitched without discovery' },
    { id: 'prod_accuracy', name: 'No false claims; pricing and terms stated correctly', category: 'Product accuracy', type: 'passfail', weight: 15, severity: 'critical', engine: 'AI', enabled: true,
      desc: 'Premium, charges, lock-in, waiting periods and benefits match the product sheet. Unknown answers are deferred, not guessed.', flag: 'Inaccurate or unsupported product claim' },
    { id: 'obj_handling', name: 'Acknowledged concern and answered with facts', category: 'Objection handling', type: 'scale', weight: 12, severity: 'minor', engine: 'AI', enabled: true,
      desc: 'Agent acknowledges the objection, responds with facts, and does not argue or pressure.', flag: 'Poor objection handling' },
    { id: 'comp_disclosure', name: 'Mandatory risk disclosure was read', category: 'Compliance', type: 'passfail', weight: 15, severity: 'critical', engine: 'Rule', enabled: true,
      desc: 'At least one approved disclosure phrase must appear in the agent’s speech. Deterministic phrase check.', flag: 'Mandatory disclosure missing',
      rule: { mode: 'required', phrases: ['subject to market risk', 'market risks ke subject', 'free look', 'read all scheme related documents', 'policy document', 'sales brochure', 'policy wordings'] } },
    { id: 'comp_claims', name: 'No guaranteed-return or misleading claims', category: 'Compliance', type: 'passfail', weight: 14, severity: 'critical', engine: 'Hybrid', enabled: true,
      desc: 'Phrase list catches known violations (negation-aware); the AI reviews nuance such as implied guarantees.', flag: 'Prohibited or misleading claim',
      rule: { mode: 'prohibited', phrases: ['guarantee', 'guaranteed', 'assured return', 'assured returns', 'risk free', 'no risk', 'bilkul safe', 'risk nahi', 'risk vir kuch nahi', 'fd jaisa', 'double ho', 'paisa double', 'wada hai', '100 percent safe', 'pakka return'] } },
    { id: 'comp_consent', name: 'Recording notice given; consent and opt-outs respected', category: 'Compliance', type: 'passfail', weight: 6, severity: 'major', engine: 'Hybrid', enabled: true,
      desc: 'Recording notice early in the call; no sensitive data collected without consent; “do not call” honoured.', flag: 'Consent or opt-out issue' },
    { id: 'tone_conduct', name: 'Polite, no interrupting, no abusive language', category: 'Tone and conduct', type: 'scale', weight: 8, severity: 'major', engine: 'Hybrid', enabled: true,
      desc: 'AI judges tone; rules layer measures interruptions and talk-to-listen ratio.', flag: 'Tone or conduct concern' },
    { id: 'close_next', name: 'Clear next step, summary and follow-up time agreed', category: 'Closing', type: 'scale', weight: 7, severity: 'minor', engine: 'AI', enabled: true,
      desc: 'Agent recaps, states the next step and agrees a specific follow-up time.', flag: 'No clear next step' }
  ];

  CL.RECORDING_PHRASES = ['recorded', 'recording', 'record ki ja rahi', 'record ho rahi'];

  /* ---------- Agents ---------- */
  CL.AGENTS = [
    { id: 'a1', name: 'Priya Nair', team: 'Mumbai · Floor 2', tenure: '3 yrs', color: '#0d9488', w: { T1: 5, T2: 4, T8: 5, T3: 2, T4: 1 } },
    { id: 'a2', name: 'Aarav Mehta', team: 'Mumbai · Floor 2', tenure: '2 yrs', color: '#2563eb', w: { T1: 3, T2: 3, T8: 3, T3: 3, T4: 2, T7: 1 } },
    { id: 'a3', name: 'Rohan Deshmukh', team: 'Pune · Floor 1', tenure: '14 mo', color: '#7c3aed', w: { T3: 4, T4: 4, T8: 2, T1: 2, T7: 2, T5: 1 } },
    { id: 'a4', name: 'Sneha Iyer', team: 'Mumbai · Floor 2', tenure: '8 mo', color: '#db2777', trend: 'up', wOld: { T3: 4, T4: 4, T7: 3, T5: 1 }, w: { T1: 4, T2: 3, T8: 4, T3: 1 } },
    { id: 'a5', name: 'Imran Qureshi', team: 'Pune · Floor 1', tenure: '2 yrs', color: '#d97706', w: { T7: 4, T3: 3, T4: 3, T1: 2, T2: 1, T5: 2 } },
    { id: 'a6', name: 'Kavya Reddy', team: 'Mumbai · Floor 2', tenure: '4 yrs', color: '#0891b2', w: { T2: 6, T8: 3, T1: 3, T4: 2, T3: 1 } },
    { id: 'a7', name: 'Vikram Singh Rathore', team: 'Pune · Floor 1', tenure: '5 mo', color: '#dc2626', w: { T5: 3, T6: 2, T3: 4, T7: 2, T4: 2, T8: 1 } },
    { id: 'a8', name: 'Neha Kulkarni', team: 'Pune · Floor 1', tenure: '19 mo', color: '#65a30d', trend: 'down', wOld: { T1: 4, T2: 3, T8: 4, T3: 1 }, w: { T3: 2, T4: 2, T5: 3, T6: 1, T7: 2, T1: 1 } }
  ];

  CL.CUSTOMERS = ['Rahul Verma', 'Sunita Joshi', 'Amit Kulkarni', 'Deepa Menon', 'Farhan Sheikh', 'Pooja Agarwal', 'Manish Tiwari', 'Lakshmi Narayanan', 'Gurpreet Singh', 'Anjali Bhatt', 'Sanjay Patil', 'Meera Krishnan', 'Rajesh Gupta', 'Nisha Pandey', 'Karan Malhotra', 'Shweta Desai', 'Arjun Nambiar', 'Rekha Yadav', 'Suresh Iyer', 'Tanvi Shah', 'Vivek Choudhary', 'Ayesha Khan', 'Harish Reddy', 'Komal Jain', 'Pradeep Mishra', 'Divya Chawla', 'Mohit Saxena', 'Bhavna Trivedi', 'Ashok Pillai', 'Ritu Bansal'];

  CL.SOURCES = [['Exotel', 40], ['Knowlarity', 25], ['Ozonetel', 15], ['Twilio', 10], ['Folder sync', 10]];

  CL.OUTCOMES = ['Follow-up scheduled', 'Application started', 'Info requested', 'Callback requested', 'Payment link sent', 'Not interested'];

  /* shorthand: result tuple  [score, evidenceSubstring|null, note, severityOverride?]  */
  const r = (s, ev, note, sev) => ({ s, ev, note, sev });

  /* ---------- Scripted call archetypes ----------
     Line format  "A|text" agent, "C|text" customer. "!" after speaker = starts over the other speaker (interruption). */
  CL.ARCH = {
    /* T1 — strong Hinglish term-insurance call */
    T1: {
      lang: 'Hinglish', product: 'Anvaya TermShield Plus', ptype: 'Term insurance', outcome: 'Follow-up scheduled', asr: 0.94,
      lines: [
        'A|Namaste, main {A} bol raha hoon Anvaya Financial se. Kya meri baat {C} ji se ho rahi hai?',
        'C|Haan, boliye, main {C} bol raha hoon.',
        'A|Dhanyavaad {C} ji. Ek zaroori baat, yeh call quality aur training ke liye record ki ja rahi hai. Kya aap agle do-teen minute baat kar sakte hain?',
        'C|Haan haan, kar sakta hoon. Aap kis baare mein call kar rahe hain?',
        'A|Aapne hamari website par term insurance ke liye enquiry daali thi, usi ke baare mein. Sabse pehle main samajhna chahta hoon, aap policy kis ke liye lena chahte hain, family ki suraksha ke liye ya kuch aur?',
        'C|Mere do bachche hain aur wife ghar sambhalti hai. Home loan bhi chal raha hai, toh kuch ho jaaye toh unko dikkat na ho.',
        'A|Samajh gaya, yeh bahut samajhdaari ki baat hai. Aapki umar aur mahine ki income thodi bata sakte hain? Taaki main sahi cover suggest kar sakoon.',
        'C|Main 34 saal ka hoon, salary lagbhag ek lakh bees hazaar mahina hai. Home loan ki EMI achatis hazaar jaati hai.',
        'A|Theek hai. Aur premium ke liye aap kitna saalana comfortable rakhna chahenge? Koi budget socha hai?',
        'C|Dekhiye, saal ka pandrah se atharah hazaar tak theek rahega, usse zyada nahi.',
        'A|Bilkul. Aapki income ke hisaab se aam taur par das se barah guna cover suggest kiya jaata hai. Anvaya TermShield Plus mein ek crore ka cover, chauntis saal ki umar, tees saal ke liye lagbhag chaudah hazaar aath sau rupaye saalana premium aata hai, non-smoker ke liye.',
        'C|Itna kam? Isme koi chhupa hua charge toh nahi hai? Mere ek dost ko claim mein problem aayi thi.',
        'A|Achha sawaal hai {C} ji, aur aapki chinta jayaz hai. Isme koi chhupa charge nahi hai. Bas health aur smoking ki jaankari form mein sahi bharni hoti hai, kyunki galat jaankari par claim reject ho sakta hai. Hamara claim settlement ratio pichhle saal 98.2 percent raha, jo company ki website par public hai.',
        'C|Aur agar mujhe beech mein policy band karni ho toh?',
        'A|Yeh ek pure term plan hai, isliye maturity par paisa wapas nahi milta, yeh main saaf bata dun. Aapko tees din ka free-look period milta hai, uske andar policy document padhkar aap cancel kar sakte hain. Kripya policy document aur sales brochure dhyaan se padhiye.',
        'C|Achha, matlab maturity par kuch nahi milega. Theek hai, mujhe sirf suraksha chahiye.',
        'A|Bilkul sahi. Agar aap chahein toh return of premium wala variant bhi hai, par uska premium kaafi zyada hota hai. Aapke budget mein pure term hi behtar rahega.',
        'C|Haan, wahi theek hai. Aage kya karna hoga?',
        'A|Main aapko email par quotation aur policy document bhej dunga. Aap family se baat karke dekh lijiye. Kya hum Thursday shaam 6 baje dobara baat kar sakte hain?',
        'C|Haan, Thursday 6 baje chalega. Email par bhej dijiye.',
        'A|Perfect. Toh recap: ek crore ka cover, lagbhag chaudah hazaar aath sau saalana premium, tees saal ki term, aur tees din ka free-look. Kya email wahi hai jo enquiry form mein diya tha?',
        'C|Haan, wahi hai.',
        'A|Dhanyavaad {C} ji, aapka din shubh ho. Thursday ko shaam 6 baje baat karte hain.',
        'C|Thank you, namaste.'
      ],
      res: {
        open_greet: r(5, 'bol raha hoon Anvaya Financial', 'Greets, names self and company, and confirms the person in the first turn.'),
        open_verify: r(1, 'ji se ho rahi hai', 'Asks “Kya meri baat {C} ji se ho rahi hai?” and waits for confirmation.'),
        disc_needs: r(4, 'policy kis ke liye lena chahte hain', 'Asked purpose, age, income and budget. Did not ask about existing life cover.'),
        prod_accuracy: r(1, 'maturity par paisa wapas nahi milta', 'Premium, cover and the no-maturity-benefit nature of a pure term plan stated correctly.'),
        obj_handling: r(4, 'Achha sawaal hai', 'Acknowledged the hidden-charges worry and answered with facts (claim settlement ratio). Could have offered a sample claim walkthrough.'),
        comp_consent: r(1, 'quality aur training ke liye record', 'Recording notice in the first 10 seconds, with permission to continue.'),
        tone_conduct: r(5, 'bahut samajhdaari ki baat hai', 'Warm and patient; no interruptions; mirrors the customer’s concern.'),
        close_next: r(5, 'Thursday shaam 6 baje', 'Recap, email commitment and a specific follow-up slot (Thursday 6 PM).')
      },
      summary: {
        intent: 'Term cover of about ₹1 crore to protect wife and two children; ₹38,000 monthly home-loan EMI.',
        objections: ['Premium looks too low — hidden charges?', 'Friend had a claim problem', 'No maturity benefit'],
        followups: [['Email TermShield quotation and policy document', 'Agent', 'Today'], ['Call back after family discussion', 'Agent', 'Thu, 6:00 PM']],
        sentiment: ['Neutral', 'Positive'],
        facts: ['Age 34 · income ₹1.2 L / month', 'Quote: ₹1 Cr cover · ₹14,800 / yr · 30-yr term', 'Budget ₹15–18k / yr']
      },
      coach: {
        strengths: ['Recording notice and permission to continue within 10 seconds', 'Asked purpose, income and budget before quoting', 'Disclosed free-look period and the no-maturity-benefit nature of the plan'],
        improve: [{ t: 'Ask about existing life cover before recommending a sum assured.', ev: 'Taaki main sahi cover', say: '“Aapke paas pehle se koi life insurance ya office ka group cover hai?”' }]
      }
    },

    /* T2 — strong English SIP call */
    T2: {
      lang: 'English', product: 'Anvaya SIP Starter', ptype: 'Mutual fund SIP', outcome: 'Application started', asr: 0.97,
      lines: [
        'A|Good afternoon, this is {A} from Anvaya Financial. Am I speaking with {C}?',
        'C|Yes, speaking.',
        'A|Thanks, {C}. Just to let you know, this call is being recorded for quality and training purposes. Is this a good time for a quick chat about your SIP enquiry?',
        'C|Sure, I have around five minutes.',
        'A|Great. Before I suggest anything, could you tell me what you’re hoping to achieve? Is this for a specific goal or general wealth building?',
        'C|Mostly long-term. I want to build a corpus for a house down payment in about seven years.',
        'A|That’s a clear goal. Do you have any existing investments, and roughly how much could you set aside each month without stretching yourself?',
        'C|I have an emergency fund and a small PPF. I can do maybe ten thousand a month.',
        'A|That works well. For a seven-year horizon, a flexible-cap or hybrid fund through Anvaya SIP Starter would be reasonable. Over the last five years the flexi-cap fund returned about 13 percent annualised, but I want to be clear that past performance doesn’t indicate future returns.',
        'C|Why not just put it in a fixed deposit? It’s safer, isn’t it?',
        'A|Fair question. A fixed deposit gives certainty but typically lower post-tax returns. Mutual funds can earn more over seven years, but they carry risk and your capital can go down in the short term. If you can’t tolerate any dip, a debt-heavy hybrid fund may suit you better.',
        'C|Hmm, I can handle some dip. What are the charges?',
        'A|The expense ratio on the direct plan is 0.72 percent a year, there’s no entry load, and there’s an exit load of 1 percent only if you redeem within a year.',
        'C|Okay. And can I stop the SIP anytime?',
        'A|Yes, you can pause or stop anytime without penalty. Mutual fund investments are subject to market risks. Please read all scheme related documents carefully before investing.',
        'C|Understood. What do I need to start?',
        'A|PAN, Aadhaar-based KYC and a bank mandate. I’ll email the scheme documents and the KYC link today. Would it help if I called you Friday at eleven to answer any questions after you’ve read them?',
        'C|Friday at eleven works.',
        'A|Wonderful. To recap: ten thousand rupees a month, flexi-cap fund, seven-year goal, documents by email today, and a call on Friday at 11 AM. Thank you for your time, {C}.',
        'C|Thanks, bye.'
      ],
      res: {
        open_greet: r(5, 'this is {A} from Anvaya', 'Greets and states name and company, then confirms the person.'),
        open_verify: r(1, 'Am I speaking with', 'Confirms identity in the first turn.'),
        disc_needs: r(4, 'hoping to achieve', 'Explores goal, existing investments and monthly capacity. Could probe risk tolerance with a scenario.'),
        prod_accuracy: r(1, 'expense ratio on the direct plan', 'Expense ratio, load and returns stated with the right caveats.'),
        obj_handling: r(4, 'Fair question', 'Acknowledges the FD comparison and answers honestly about risk and returns.'),
        comp_consent: r(1, 'being recorded for quality', 'Recording notice in the first minute and confirms it is a good time.'),
        tone_conduct: r(4, 'Great. Before I suggest anything', 'Courteous, unhurried, no interruptions.'),
        close_next: r(4, 'called you Friday at eleven', 'Recap and a specific follow-up slot. Could have confirmed the email address.')
      },
      summary: {
        intent: 'Start a ₹10,000 monthly SIP for a seven-year house down-payment goal.',
        objections: ['Why not a fixed deposit?', 'Charges and ability to stop the SIP'],
        followups: [['Email scheme documents and KYC link', 'Agent', 'Today'], ['Follow-up call after document review', 'Agent', 'Fri, 11:00 AM']],
        sentiment: ['Neutral', 'Positive'],
        facts: ['Goal: house down payment · 7 years', 'Budget ₹10,000 / month', 'Expense ratio 0.72% · exit load 1% < 1 yr']
      },
      coach: {
        strengths: ['Quoted historical returns with a clear past-performance caveat', 'Gave an honest FD vs equity trade-off', 'Stated expense ratio and exit load without being asked twice'],
        improve: [
          { t: 'Probe risk tolerance with a concrete scenario before suggesting a fund.', ev: 'flexible-cap or hybrid', say: '“If the fund fell 15% in the first year, would you carry on with the SIP?”' },
          { t: 'Read the market-risk disclosure earlier; it came after the charges discussion.', ev: 'subject to market risks' }
        ]
      }
    },

    /* T3 — average Hinglish ULIP call: weak discovery, evasive on charges */
    T3: {
      lang: 'Hinglish', product: 'Anvaya SecureGrowth ULIP', ptype: 'ULIP', outcome: 'Info requested', asr: 0.92,
      lines: [
        'A|Hello, {C} ji? Main {A}, Anvaya Financial se.',
        'C|Haan boliye.',
        'A|Sir, yeh call recorded hai. Aapne SecureGrowth ULIP mein interest dikhaya tha na?',
        'C|Haan, ek baar dekha tha website par. Kya hai yeh exactly?',
        'A|Yeh ek ULIP plan hai, isme insurance bhi milta hai aur investment bhi. Bahut popular plan hai, kaafi log le rahe hain. Aap ek baar ye dekh lijiye, bahut achha hai.',
        'C|Insurance aur investment dono? Kitna cover milta hai?',
        'A|Cover aapke premium ka das guna tak ho sakta hai. Aur fund mein aap equity ya debt choose kar sakte hain.',
        'C|Aur returns kaise hain? Pichhle saal kitna mila?',
        'A|Equity fund ne pichhle paanch saal mein lagbhag barah percent diya hai. Aage ka toh koi bata nahi sakta, par achha hi rahega.',
        'C|“Achha hi rahega” matlab pakka nahi hai?',
        'A|Haan sir, market se linked hai na. Lekin long term mein aapko achha return milega.',
        'C|Mujhe lagta hai yeh mehnga hai. Mere dost ne bola ULIP mein bahut charges lagte hain.',
        'A|Nahi nahi, charges itne zyada nahi hain. Thode bahut hain, premium allocation aur fund management, woh toh sab jagah hote hain.',
        'C|Kitne percent? Exact batao.',
        'A|Exact toh abhi mere paas nahi hai, main details bhej dunga. Aap bas aaj form bhar dijiye toh process shuru ho jayega.',
        'C|Abhi nahi, pehle details dekhni hain.',
        'A|Theek hai sir. Ek baat, ULIP market risks ke subject hai, please sab documents padh lijiye.',
        'C|Okay, mujhe detail bhej dijiye.',
        'A|Haan sir, main bhej dunga. Phir baat karte hain. Thank you.',
        'C|Okay bye.'
      ],
      res: {
        open_greet: r(4, 'Main {A}, Anvaya Financial se', 'Names self and company, but the greeting is brief.'),
        open_verify: r(1, 'Hello, {C} ji?', 'Checks identity with “{C} ji?”.'),
        disc_needs: r(2, 'Bahut popular plan hai', 'Went straight to the pitch. Never asked about goals, existing investments or monthly budget.'),
        prod_accuracy: r(0, 'charges itne zyada nahi hain', 'Downplayed ULIP charges without numbers and could not quote allocation or fund-management charges when asked.', 'major'),
        obj_handling: r(2, 'Exact toh abhi mere paas nahi hai', 'Deflected the charges question and pushed the customer to fill the form instead of answering with facts.'),
        comp_consent: r(1, 'yeh call recorded hai', 'Recording notice given, though without asking permission to continue.'),
        tone_conduct: r(4, 'Theek hai sir', 'Polite throughout, no interruptions. Slightly salesy tone.'),
        close_next: r(2, 'Phir baat karte hain', 'No specific callback time; “phir baat karte hain” is open-ended.')
      },
      summary: {
        intent: 'Wants to understand what the SecureGrowth ULIP is and how returns and charges work.',
        objections: ['ULIP charges seem high', 'Returns are not certain'],
        followups: [['Send ULIP benefit illustration with charge breakup', 'Agent', 'Not specified']],
        sentiment: ['Neutral', 'Neutral'],
        facts: ['Cover up to 10× premium', '5-yr equity fund CAGR quoted at ~12%', 'Charges not quantified']
      },
      coach: {
        strengths: ['Recording notice at the start', 'Did not overclaim returns; said the plan is market-linked'],
        improve: [
          { t: 'Run discovery before pitching: goal, existing investments, monthly comfort.', ev: 'Yeh ek ULIP plan hai', say: '“Aap yeh paisa kis goal ke liye invest karna chahte hain, aur mahine mein kitna comfortable hai?”' },
          { t: 'Never deflect a charges question. Keep the benefit illustration open and quote allocation and fund-management charges.', ev: 'Exact toh abhi mere paas nahi hai' },
          { t: 'Read the risk disclosure before closing, in full, not as an afterthought.', ev: 'market risks ke subject' },
          { t: 'Agree a specific callback time instead of “phir baat karte hain”.', ev: 'Phir baat karte hain' }
        ]
      }
    },

    /* T4 — average English health-insurance call: pushy, no recording notice */
    T4: {
      lang: 'English', product: 'Anvaya HealthFirst Family Floater', ptype: 'Health insurance', outcome: 'Info requested', asr: 0.96,
      lines: [
        'A|Hi, am I speaking with {C}? This is {A} calling from Anvaya Financial.',
        'C|Yes, who is this?',
        'A|I’m calling regarding the HealthFirst family floater plan you looked at on our site. It’s one of our best sellers, covering the whole family up to ten lakh.',
        'C|I only browsed it. How much would it cost?',
        'A|For a family of four, it comes to around twenty-four thousand five hundred per year. That includes hospitalisation, day-care procedures and ambulance cover.',
        'C|That’s quite high. My employer already provides group cover.',
        'A|See, group cover ends when you leave the job, that’s the problem. You really should have your own policy, I’d say it’s a must.',
        'C|I’m not planning to leave right now. I’ll think about it.',
        'A|Sir, thinking is fine but premiums go up every year with age, so waiting just costs more. Honestly, you’re making a mistake by not buying today.',
        'C|Look, I don’t like being pushed. Does it cover pre-existing conditions?',
        'A|Yes, pre-existing diseases are covered after a waiting period of three years. Maternity has a twenty-four month waiting period, and there is a two percent room-rent cap.',
        'C|Okay, that’s useful. What if I want to cancel?',
        'A|You have a free-look period of fifteen days after receiving the policy document, and you can cancel within that window. Please read the policy wordings and exclusions carefully before buying.',
        'C|Alright. Send me the details and I’ll discuss with my wife.',
        'A|Sure, I’ll send the brochure on WhatsApp. Let me know whenever you’re ready.',
        'C|Okay, thanks.',
        'A|Thanks, have a good day.'
      ],
      res: {
        open_greet: r(3, 'This is {A} calling from Anvaya', 'Introduces self and company but does not ask whether it is a good time.'),
        open_verify: r(1, 'am I speaking with {C}', 'Confirms identity at the start.'),
        disc_needs: r(2, 'one of our best sellers', 'Pitched immediately. No questions about family, existing cover or budget.'),
        prod_accuracy: r(1, 'pre-existing diseases are covered', 'Waiting periods, room-rent cap and free-look stated correctly.'),
        obj_handling: r(2, 'making a mistake by not buying today', 'Argued with the “I’ll think about it” objection and used pressure instead of comparing the group cover to the retail plan.'),
        comp_consent: r(0, null, 'No recording notice anywhere in the call.'),
        tone_conduct: r(3, 'it’s a must', 'Polite but increasingly insistent; the customer said they do not like being pushed.'),
        close_next: r(2, 'Let me know whenever you', 'Leaves next step with the customer; no follow-up time.')
      },
      summary: {
        intent: 'Checked the price of a family floater for four; already has employer group cover.',
        objections: ['Premium too high', 'Already covered by employer', 'Does not like being pushed'],
        followups: [['Send brochure on WhatsApp', 'Agent', 'Not specified'], ['Discuss with spouse', 'Customer', 'Unscheduled']],
        sentiment: ['Neutral', 'Neutral'],
        facts: ['₹10 L floater · ~₹24,500 / yr · family of 4', 'Pre-existing waiting period 3 yrs · maternity 24 mo', 'Room-rent cap 2%']
      },
      coach: {
        strengths: ['Accurate on waiting periods, room-rent cap and free-look period', 'Gave a clear price for a family of four'],
        improve: [
          { t: 'State the recording notice at the start of every call.', say: '“This call is recorded for quality and training. Is that okay?”' },
          { t: 'Avoid telling customers they are “making a mistake”. Compare group cover to a retail plan instead.', ev: 'making a mistake by not buying today', say: '“Group cover is a good base. Shall I show where it may fall short, like cover size and portability?”' },
          { t: 'Ask about family, existing cover and budget before quoting.', ev: 'one of our best sellers' },
          { t: 'Book a follow-up slot instead of “let me know”.', ev: 'Let me know whenever you' }
        ]
      }
    },

    /* T5 — non-compliant Hinglish ULIP call ("Call B"): guaranteed returns, no disclosure, interruptions */
    T5: {
      lang: 'Hinglish', product: 'Anvaya SecureGrowth ULIP', ptype: 'ULIP', outcome: 'Payment link sent', asr: 0.91,
      lines: [
        'A|Hello {C} ji, main {A} bol raha hoon Anvaya Financial se. Kaise hain aap?',
        'C|Haan, boliye.',
        'A|Sir, aapke liye ek bahut badhiya investment plan hai, SecureGrowth ULIP. Isme main aapko guaranteed 20 percent returns de sakta hoon har saal.',
        'C|Bees percent guaranteed? Itna toh FD bhi nahi deta. Market risk nahi hai kya?',
        'A|Arre sir, risk-vir kuch nahi hai, bilkul safe hai. Hamare saare customers ko itna hi mil raha hai. Bas aap paisa daal dijiye.',
        'C|Achha? Lekin maine suna hai ULIP mein lock-in hota hai. Mujhe apne paise...',
        'A!|Haan haan lock-in hai, par uski chinta mat kijiye. Aap ye bataiye, kitna invest kar sakte hain? Do lakh? Paanch lakh?',
        'C|Abhi itna nahi, mere paas ek lakh ke aas-paas hai. Lekin pehle mujhe samajhna hai ki...',
        'A!|Ek lakh bhi chalega. Dekhiye, yeh offer sirf aaj ke liye hai. Kal se rate badal jayega aur aapko bees percent nahi milega.',
        'C|Par documents, terms and conditions kuch bhejenge? Mujhe padhna hai.',
        'A|Documents baad mein dekh lena, pehle form bhar dijiye. Main abhi aapke WhatsApp par payment link bhej raha hoon.',
        'C|Mujhe thoda time chahiye. Yeh bees percent pakka hai na?',
        'A|Mera aapse wada hai sir, double ho jayega aapka paisa paanch saal mein. Main hoon na.',
        'C|Theek hai, link bhej dijiye, main dekhta hoon.',
        'A|Bhej diya. Aaj hi pay kar dena, warna slot nahi milega.',
        'C|Okay okay.',
        'A|Thank you sir.'
      ],
      res: {
        open_greet: r(3, 'bol raha hoon Anvaya Financial', 'Names self and company; skips asking whether it is a good time.'),
        open_verify: r(1, 'Hello {C} ji', 'Addresses the customer by name.'),
        disc_needs: r(1, 'bahut badhiya investment plan hai', 'Pitched in the second turn. The only question asked (“kitna invest kar sakte hain?”) was to push the amount up.'),
        prod_accuracy: r(0, 'guaranteed 20 percent returns', 'Promised guaranteed 20% annual returns on a market-linked ULIP and said the money would double in five years.'),
        obj_handling: r(1, 'Documents baad mein dekh lena', 'Dismissed the lock-in worry and the request for terms and conditions; used urgency instead of facts.'),
        comp_consent: r(0, null, 'No recording notice anywhere in the call.'),
        tone_conduct: r(2, 'Haan haan lock-in hai', 'Interrupted the customer twice and used artificial urgency (“sirf aaj ke liye”).', 'major'),
        close_next: r(2, 'Aaj hi pay kar dena', 'Pushes same-day payment; no recap or agreed follow-up.')
      },
      summary: {
        intent: 'Interested in investing around ₹1 lakh; asked about lock-in and wanted the terms in writing first.',
        objections: ['“20% guaranteed” sounds too good to be true', 'Lock-in period', 'Wanted documents before paying'],
        followups: [['Payment link (₹1,00,000) sent on WhatsApp', 'Agent', 'Sent'], ['Customer to review link', 'Customer', 'Unscheduled']],
        sentiment: ['Neutral', 'Hesitant'],
        facts: ['Agent promised 20% guaranteed returns', 'Agent said money would double in 5 years', 'Payment link sent before disclosure or documents']
      },
      coach: {
        strengths: ['Quick rapport and energetic delivery'],
        improve: [
          { t: 'Never promise or imply guaranteed returns on a market-linked product. This is a regulatory violation.', ev: 'guaranteed 20 percent returns', say: '“ULIP returns depend on market performance and are not guaranteed. The benefit illustration shows past performance.”' },
          { t: 'Read the mandatory risk disclosure and share documents before sending a payment link.', ev: 'Documents baad mein dekh lena' },
          { t: 'Let the customer finish their sentence. Two interruptions in under three minutes.', ev: 'Haan haan lock-in hai' },
          { t: 'Drop artificial urgency. It undermines trust and counts as pressure selling.', ev: 'sirf aaj ke liye' },
          { t: 'Give the recording notice in the first 15 seconds.' }
        ]
      }
    },

    /* T6 — severe: mis-selling, rude, ignores opt-out */
    T6: {
      lang: 'Hinglish', product: 'Anvaya SecureGrowth ULIP', ptype: 'ULIP', outcome: 'Not interested', asr: 0.9,
      lines: [
        'A|Haan hello, {C} bol rahe ho? Anvaya Financial se {A} bol raha hoon.',
        'C|Haan boliye.',
        'A|Aapne ULIP ke liye enquiry ki thi. Yeh plan FD jaisa hi hai, bas usse zyada return milta hai aur bilkul safe hai, paisa doobne ka sawal hi nahi.',
        'C|ULIP toh market se linked hota hai na? Mere pados ne bola ki isme risk hota hai.',
        'A|Aapke pados ko kuch pata nahi hai. Main roz yeh bechta hoon, mujhse zyada kaun jaanta hai? Kuch risk nahi hai isme.',
        'C|Lekin main sochna chahta hoon, mujhe abhi jaldi nahi hai.',
        'A!|Sochna kya hai isme? Har baar yahi bolte ho aap log. Time waste mat kijiye, yes ya no boliye abhi.',
        'C|Aap thoda tameez se baat kijiye please.',
        'A|Tameez? Main aapko faayda dilwa raha hoon aur aap ehsaan bhi nahi maante. Aisi soch ke saath aap kabhi paisa nahi bana paoge.',
        'C|Main yeh call record karke complaint karunga.',
        'A|Jo karna hai karo, mujhe farak nahi padta.',
        'C|Bas, call band kijiye. Dobara call mat karna.',
        'A!|Theek hai, bas ek minute, form bhar do, offer kal khatam ho jayega.',
        'C|Maine kaha na, dobara call mat karna.',
        'A|Hmm. Okay.'
      ],
      res: {
        open_greet: r(2, 'Haan hello', 'Casual opener; introduces company but no proper greeting.'),
        open_verify: r(1, 'bol rahe ho?', 'Checks identity.'),
        disc_needs: r(1, 'Yeh plan FD jaisa hi hai', 'No discovery. Opened with a misleading comparison.'),
        prod_accuracy: r(0, 'FD jaisa hi hai', 'Described a market-linked ULIP as “FD jaisa” and “bilkul safe”, and said there is no risk.'),
        obj_handling: r(1, 'Aapke pados ko kuch pata nahi hai', 'Dismissed the customer’s neighbour and the customer’s own concern; argued instead of answering.'),
        comp_consent: r(0, 'bas ek minute, form bhar do', 'Customer asked twice not to be called again; agent kept selling. No recording notice.'),
        tone_conduct: r(1, 'Tameez? Main aapko', 'Condescending and insulting language, interrupted the customer, and dismissed a complaint threat.', 'critical'),
        close_next: r(1, 'Hmm. Okay.', 'No next step; call ended abruptly after an opt-out request.')
      },
      summary: {
        intent: 'Enquired about ULIP; wanted time to think before deciding.',
        objections: ['ULIP carries market risk', 'Not ready to decide'],
        followups: [['Add customer to Do-Not-Call list', 'Compliance', 'Immediately']],
        sentiment: ['Neutral', 'Angry'],
        facts: ['Customer asked not to be called, twice', 'Customer said they will file a complaint', 'Agent used insulting language']
      },
      coach: {
        strengths: [],
        improve: [
          { t: 'Mis-selling: a ULIP was described as “FD jaisa” and risk-free. Re-train on product suitability and prohibited phrases.', ev: 'FD jaisa hi hai' },
          { t: 'Abusive and dismissive language toward the customer. Requires manager conduct review.', ev: 'Tameez? Main aapko' },
          { t: 'Opt-out requests must end the pitch and trigger a DNC entry.', ev: 'bas ek minute, form bhar do', say: '“Samajh gaya, main aapka number do-not-call list mein daal deta hoon. Maaf kijiye pareshani ke liye.”' }
        ]
      }
    },

    /* T7 — consent issue: ignores "in a meeting", asks for PAN verbally, no recording notice */
    T7: {
      lang: 'Hinglish', product: 'Anvaya SIP Starter', ptype: 'Mutual fund SIP', outcome: 'Callback requested', asr: 0.93,
      lines: [
        'A|Hello, {C} ji? {A} from Anvaya Financial.',
        'C|Haan ji. Main abhi ek meeting mein hoon, thoda jaldi bolo.',
        'A|Bas do minute lunga sir. Aapne SIP Starter ke liye enquiry ki thi, monthly kitna invest karne ka plan hai?',
        'C|Pata nahi, paanch hazaar ke aas-paas shayad.',
        'A|Perfect. Paanch hazaar mein hum flexi-cap fund suggest karenge. Pichhle teen saal mein usne lagbhag chaudah percent annualised diya hai, lekin past performance future ki guarantee nahi hoti.',
        'C|Theek hai. Meeting mein hoon, baad mein baat karte hain?',
        'A|Sir bas do minute aur. Process shuru karne ke liye aapka PAN number aur date of birth abhi bata dijiye, main form bhar deta hoon.',
        'C|Phone par PAN? Pehle documents bhej do na.',
        'A|Koi dikkat nahi hoti sir, call par hi bata dijiye, jaldi ho jayega. Aaj kal sab aise hi karte hain.',
        'C|Nahi, main email par bhejta hoon. Aap documents bhej do.',
        'A|Theek hai sir, main mail bhej dunga. Mutual fund investments are subject to market risks, please read all scheme related documents carefully.',
        'C|Okay. Kab call karoge?',
        'A|Main baad mein call karunga sir. Thank you.',
        'C|Bye.'
      ],
      res: {
        open_greet: r(3, 'from Anvaya Financial', 'Introduces company; no greeting beyond “Hello”.'),
        open_verify: r(1, 'Hello, {C} ji?', 'Checks identity.'),
        disc_needs: r(3, 'monthly kitna invest karne ka plan', 'Asked only the monthly amount; no goal or risk-profile questions.'),
        prod_accuracy: r(1, 'past performance future ki guarantee nahi hoti', 'Return figure quoted with the correct past-performance caveat.'),
        obj_handling: r(2, 'Sir bas do minute aur', 'Customer said they were in a meeting; agent pushed on instead of offering a callback.'),
        comp_consent: r(0, 'PAN number aur date of birth abhi bata dijiye', 'Asked for PAN and DOB verbally with no recording notice, and pressed after the customer refused.'),
        tone_conduct: r(3, 'Koi dikkat nahi hoti sir', 'Polite wording, but did not respect the customer’s time constraint.'),
        close_next: r(2, 'Main baad mein call karunga', 'Callback time was not agreed.')
      },
      summary: {
        intent: 'Started enquiring about a ₹5,000 monthly SIP while in a meeting.',
        objections: ['Busy: asked to be called later', 'Unwilling to share PAN over the phone'],
        followups: [['Email scheme documents', 'Agent', 'Today'], ['Callback', 'Agent', 'Time not agreed']],
        sentiment: ['Neutral', 'Neutral'],
        facts: ['SIP ₹5,000 / month', '3-yr flexi-cap return quoted ~14% with caveat', 'Agent asked for PAN and DOB on the call']
      },
      coach: {
        strengths: ['Accurate return disclaimer', 'Market-risk disclosure read in full'],
        improve: [
          { t: 'Respect “I’m in a meeting”. Offer a callback slot immediately.', ev: 'Bas do minute lunga sir', say: '“Koi baat nahi sir, aap kab free honge? Main usi samay call karta hoon.”' },
          { t: 'Never collect PAN or DOB verbally. Send a secure link.', ev: 'PAN number aur date of birth', say: '“Main aapko secure link bhejta hoon jahan aap PAN safely bhar sakte hain.”' },
          { t: 'Give the recording notice at the start of the call.' },
          { t: 'Agree a callback time before ending.', ev: 'Main baad mein call karunga' }
        ]
      }
    },

    /* T8 — strong Hinglish health-insurance call with price objection */
    T8: {
      lang: 'Hinglish', product: 'Anvaya HealthFirst Family Floater', ptype: 'Health insurance', outcome: 'Follow-up scheduled', asr: 0.93,
      lines: [
        'A|Namaste {C} ji, main {A} bol raha hoon Anvaya Financial se. Kya main {C} ji se baat kar raha hoon?',
        'C|Ji haan.',
        'A|Shukriya. Aapko bata dun ki call quality ke liye record ho rahi hai. Aapne health insurance ke liye enquiry ki thi, abhi do minute baat kar sakte hain?',
        'C|Haan, par jaldi. Mujhe pata hai premium bahut hota hai, isliye hi socha nahi tha.',
        'A|Samajh sakta hoon, premium ki chinta sabko hoti hai. Pehle yeh bataiye, ghar mein kaun kaun cover hona chahiye, aur koi medical condition ya pehle se policy hai?',
        'C|Main, meri wife aur chhe saal ki beti. Wife ko thyroid hai. Office ka group cover paanch lakh ka hai.',
        'A|Theek hai, thyroid ek common condition hai aur cover ho jaati hai, bas proposal form mein batana zaroori hai. Aur aap premium ke liye kitna saalana soch rahe the?',
        'C|Bees hazaar se zyada nahi. Ek aur company ka quote atharah hazaar ka mila tha.',
        'A|Achha, aur usme kya kya shamil tha? Kyunki kabhi kabhi sasta premium room-rent cap ya co-payment ke saath aata hai.',
        'C|Pata nahi, woh toh dekha nahi.',
        'A|Koi baat nahi. Hamara HealthFirst plan das lakh ka floater hai, premium ikkis hazaar do sau saalana, bina co-payment ke, aur room rent par koi cap nahi hai. Thyroid ke liye do saal ka waiting period lagta hai.',
        'C|Mera budget bees hazaar tha, ikkis hazaar zyada lag raha hai.',
        'A|Bilkul samajhta hoon. Ek option hai, saat lakh ka floater lene par premium lagbhag atharah hazaar nau sau aata hai, aur group cover ke saath aapka total cover theek rahega. Dono quote bhej deta hoon, aap compare kar lijiye, kisi par dabaav nahi hai.',
        'C|Yeh theek hai. Aur claim cashless hota hai na?',
        'A|Haan, nau hazaar se zyada network hospitals mein cashless hai. Yeh sales brochure mein likha hai, aur pandrah din ka free-look period milta hai. Kripya policy document zaroor padhiye.',
        'C|Achha, theek hai.',
        'A|Main aaj hi dono quote email kar deta hoon. Kya hum Wednesday dopahar 4 baje dobara baat kar sakte hain taaki aap decide kar sakein?',
        'C|Haan, Wednesday 4 baje theek rahega.',
        'A|Dhanyavaad. Toh recap: dono quote email par, aur Wednesday 4 baje call. Aapka din achha rahe.'
      ],
      res: {
        open_greet: r(4, 'bol raha hoon Anvaya Financial', 'Names self and company and confirms the person in the first turn.'),
        open_verify: r(1, 'Kya main {C} ji se baat', 'Confirms identity before proceeding.'),
        disc_needs: r(4, 'kaun kaun cover hona chahiye', 'Asked who needs cover, medical history, existing policy and budget.'),
        prod_accuracy: r(1, 'bina co-payment ke', 'Premium, cover size, co-pay and waiting period for the pre-existing condition stated correctly.'),
        obj_handling: r(4, 'Bilkul samajhta hoon', 'Acknowledged the price concern, probed the competitor quote, and offered a lower-cover option without pressure.'),
        comp_consent: r(1, 'call quality ke liye record', 'Recording notice and permission to continue.'),
        tone_conduct: r(5, 'Samajh sakta hoon', 'Empathetic and respectful of the customer’s time.'),
        close_next: r(5, 'Wednesday dopahar 4 baje', 'Recap, email commitment and a fixed follow-up time.')
      },
      summary: {
        intent: 'Health cover for self, wife (thyroid) and 6-year-old daughter; budget ₹20,000 a year.',
        objections: ['Premium above budget', 'Competitor quote at ₹18,000'],
        followups: [['Email ₹10 L and ₹7 L quotes', 'Agent', 'Today'], ['Decision call', 'Agent', 'Wed, 4:00 PM']],
        sentiment: ['Neutral', 'Positive'],
        facts: ['₹10 L floater · ₹21,200 / yr · no co-pay', '₹7 L option · ~₹18,900 / yr', 'Thyroid: 2-yr waiting period']
      },
      coach: {
        strengths: ['Probed what the competing quote excluded (room-rent cap, co-pay)', 'Offered a lower-cover alternative without pressure', 'Disclosed the waiting period for the pre-existing condition'],
        improve: [{ t: 'Quote the cashless network figure with the source and date.', ev: 'nau hazaar se zyada network' }]
      }
    }
  };

  CL.COACH_TIPS = {
    open_greet: 'Open with greeting, name and company, then ask if it is a good time.',
    open_verify: 'Confirm you are speaking to the right person before discussing the product.',
    disc_needs: 'Ask 2–3 open questions (goal, existing cover or investments, budget) before recommending.',
    prod_accuracy: 'Stick to the product sheet. If you do not know a charge or term, say you will confirm and follow up.',
    obj_handling: 'Use acknowledge → clarify → answer with a fact → check. Never argue or add urgency.',
    comp_disclosure: 'Read the approved risk-disclosure line before the close, word for word.',
    comp_claims: 'Remove phrases such as “guaranteed”, “bilkul safe” and “risk nahi”. Use the approved wording.',
    comp_consent: 'Give the recording notice in the first 15 seconds; never collect PAN or Aadhaar verbally; honour opt-outs.',
    tone_conduct: 'Let the customer finish. Aim for under two interruptions per call and a 40–55% agent talk share.',
    close_next: 'Recap in one sentence and agree a specific day and time for the next step.'
  };
})();
