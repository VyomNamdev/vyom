# Tools needed (Playbook v7, Section 10 "Tool stack" + Sections 5, 6, 7)

The PDF's tool stack, split by who uses each tool: things Claude can do here in the cloud,
things that need an API key from you, and things only you can do.

## A. Already available to Claude here (nothing to install)
| Job | Tool | Used for |
|---|---|---|
| Research, scripts, all 6 stages | Claude (this repo, one project folder per channel) | Bible, plans, scripts, shot lists, voice scripts, packaging |
| Assembling the video | ffmpeg (installed) | Slow zoom/pan on stills (Ch1 100→110%, Ch2 100→108%), cuts/dissolves, text stamps, music ducking, −14 LUFS loudness, 1080p/1440p export |
| Thumbnail text overlay | ImageMagick / Python Pillow (installed) | Adding the 1–4 words to the art, with a saved template per channel |
| Competitor / title research | vidIQ connector (in this session) | Keyword research, outliers, title scoring. The PDF notes 0 credits until 23 Nov 2026 |
| Design | Canva connector (in this session) | Thumbnail templates, banner, avatar |

## B. You need to give Claude an API key (needed to make images and voice here)
| Job | Pick ONE and never switch (PDF rule) | Why |
|---|---|---|
| **Images** (character reference required) | ChatGPT image (OpenAI API) **or** Google Gemini image (Gemini API). Ideogram and Leonardo also have APIs. Midjourney has **no** official API, so if you choose it you generate the images and Claude writes every prompt | ~150–220 images per Ch1 video, ~200–300 per Ch2 video, all from the locked character reference |
| **Voice** (if not your own) | **ElevenLabs** on a plan with a **commercial licence**, one voice per channel | Paragraph-by-paragraph narration at the PDF's settings (Stability 40–55%, Similarity ~75%, Style 15–30%) |
| Optional motion (5–10% of shots) | An image-to-video tool (e.g. Runway, Kling, Luma) | Rain, flicker, smoke; characters kept still |

When you're ready, tell me which ones you chose. I'll open a secure form for each key. Don't paste keys into chat.

## C. Only you can do these (install on your computer)
| Job | Tool (PDF) | Why it has to be you |
|---|---|---|
| Voice, if you narrate (PDF's "strongest option") | USB microphone + **Audacity** (free) or **Adobe Podcast Enhance** | A real human voice is the clearest "human layer" for YouTube's 2026 rules |
| Screen recordings of free AI tools (Paycheck to Plenty only) | **OBS Studio** (free) or **CapCut recorder** | These are logged-in tools on your accounts, and the footage must be your own |
| Final polish edit (optional; Claude can deliver a finished render) | **CapCut desktop** or **DaVinci Resolve** (free) | Hand-tuning timing if you want it |
| Thumbnails (optional manual touch-up) | **Canva** or **Photopea** with a saved template per channel | |
| Music | **YouTube Audio Library** (in YouTube Studio) or a licence you hold | Download from your Studio account into `assets/music/`. Never chart songs |
| Competitor research | **vidIQ / OutlierKit** free tiers; YouTube search filtered to "this month" | 10-minute listening check per channel (Section 6) |
| Channels and money | YouTube channels, Google **AdSense**, YouTube Studio (upload, schedule, Test & Compare, ad questionnaire, YPP apply) | Your accounts |
| Fact checks | IRS.gov, ConsumerFinance.gov, Investor.gov, StudentAid.gov (Ch1); court records, reputable news, books (Ch2) | The PDF requires **you** to check every number and fact before recording |
| Name lock | YouTube, Google, Spotify, Instagram, TikTok, tmsearch.uspto.gov | Section C6 checklist in each project |
