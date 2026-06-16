# 📚 AI-Powered Digital Library — Setup Guide

> Part of the **SPECTRUM** Educational Hackathon Platform

## Tech Stack
- **Next.js 14** — Framework
- **MongoDB Atlas** — Database
- **Cloudinary** — PDF & Image Storage
- **Clerk** — Authentication
- **Vapi** — Real-time Voice AI
- **Sarvam AI** — Indian Language TTS & Translation
- **Groq (Llama 3.3)** — Quiz, Summary, Chat AI

---

## ✅ Step 1: Clone & Install

```bash
# Go into the project folder
cd ai-digital-library

# Install dependencies
npm install
```

---

## ✅ Step 2: Create `.env.local`

Copy the example file:
```bash
cp .env.local.example .env.local
```

Now fill in each key (see below):

---

## ✅ Step 3: Set Up Clerk (Auth)

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **"Create Application"** → Name it "AI Digital Library"
3. Select **Email + Google** sign-in
4. From the dashboard, copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → starts with `pk_test_`
   - `CLERK_SECRET_KEY` → starts with `sk_test_`
5. In Clerk Dashboard → **Configure** → **Paths**, set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/library`
   - After sign-up: `/library`

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/library
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/library
```

---

## ✅ Step 4: Set Up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0 is fine)
3. Create a database user (username + password)
4. Go to **Network Access** → Add IP → `0.0.0.0/0` (allow all for dev)
5. Go to **Connect** → **Drivers** → Copy the URI
6. Replace `<password>` with your DB password, add `/ai-digital-library` as DB name

```env
MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/ai-digital-library
```

---

## ✅ Step 5: Set Up Cloudinary (PDF + Image Storage)

1. Go to [https://cloudinary.com](https://cloudinary.com) → Sign up free
2. From the dashboard, copy **Cloud Name**, **API Key**, **API Secret**

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ✅ Step 6: Set Up Vapi (Voice AI)

1. Go to [https://vapi.ai](https://vapi.ai) → Sign up
2. From the dashboard → **API Keys**
3. Copy the **Public Key** and **Private Key**

```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
VAPI_PRIVATE_KEY=your_vapi_private_key
```

> **Note:** Vapi uses Groq + ElevenLabs internally. The voice assistant is configured in `lib/vapi.ts`. You can customize the voice, first message, and system prompt there.

---

## ✅ Step 7: Set Up Sarvam AI (Indian Languages)

1. Go to [https://sarvam.ai](https://sarvam.ai) → Request API access
2. Copy your `api-subscription-key`

```env
SARVAM_API_KEY=your_sarvam_api_key
```

> Sarvam powers: TTS (voice summaries), Translation across 22 Indian languages

---

## ✅ Step 8: Set Up Groq (LLM)

1. Go to [https://console.groq.com](https://console.groq.com) → Sign up free
2. Go to **API Keys** → Create new key

```env
GROQ_API_KEY=your_groq_api_key
```

> Groq powers: AI Chat with books, Quiz generation, Text summaries
> Model used: `llama-3.3-70b-versatile` (same as VidyaVaani)

---

## ✅ Step 9: Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ai-digital-library/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout (Clerk provider)
│   ├── globals.css                 # Dark purple theme
│   ├── library/
│   │   └── page.tsx               # Books browsing page
│   ├── book/
│   │   └── [id]/
│   │       └── page.tsx           # Book detail + all features
│   ├── upload/
│   │   └── page.tsx               # Book upload page
│   ├── sign-in/[[...sign-in]]/    # Clerk sign-in
│   └── sign-up/[[...sign-up]]/    # Clerk sign-up
│   └── api/
│       ├── books/
│       │   ├── route.ts           # GET all, POST upload
│       │   └── [id]/
│       │       ├── route.ts       # GET single, DELETE
│       │       └── chat/route.ts  # POST text chat with book
│       ├── quiz/route.ts          # POST generate quiz, PUT save score
│       ├── summary/route.ts       # POST generate summary + TTS
│       ├── progress/route.ts      # GET/PUT reading progress
│       └── recommendations/route.ts # GET personalized recs
├── models/
│   ├── Book.ts                    # MongoDB Book schema
│   └── Progress.ts                # MongoDB Progress schema
├── lib/
│   ├── mongodb.ts                 # DB connection
│   ├── cloudinary.ts              # PDF + image upload
│   ├── groq.ts                    # LLM: quiz, summary, chat
│   ├── sarvam.ts                  # TTS + translation
│   └── vapi.ts                    # Voice assistant config
├── middleware.ts                  # Clerk route protection
├── tailwind.config.ts             # Dark purple SPECTRUM theme
└── .env.local.example             # All env vars template
```

---

## 🎨 Features Overview

| Feature | How it works |
|---|---|
| **Upload PDF** | Cloudinary stores PDF, `pdf-parse` extracts text, stored in MongoDB |
| **AI Text Chat** | Groq Llama 3.3 answers questions using extracted book text as context |
| **Voice Conversation** | Vapi SDK starts a real-time voice call with book content as context |
| **Quiz Generation** | Groq generates MCQs from book text in selected Indian language |
| **Voice Summary** | Groq generates summary → Sarvam TTS converts to audio in user's language |
| **Reading Progress** | Tracks pages, time spent, quiz scores per user per book |
| **Recommendations** | Groq analyzes reading history and suggests similar books |
| **22 Languages** | Language selector changes AI response language across all features |

---

## 🚀 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add all env vars in Vercel dashboard:
# Settings → Environment Variables → Add each key from .env.local
```

> Make sure MongoDB Atlas IP whitelist includes `0.0.0.0/0` for production

---

## 🔧 Customize Voice Persona

Edit `lib/vapi.ts` → `getVapiAssistantConfig()`:
- Change `voiceId` for different ElevenLabs voice
- Change `firstMessage` for custom greeting
- Adjust `model.messages[0].content` for different AI personality

---

## ⚠️ Common Issues

**PDF text extraction fails** → Large/scanned PDFs won't extract well. `pdf-parse` works best on text-based PDFs.

**Vapi call not connecting** → Check `NEXT_PUBLIC_VAPI_PUBLIC_KEY` is set correctly. Must start with browser-safe public key.

**Sarvam TTS silent** → Check API subscription key. Free tier has limited requests.

**Clerk redirect loop** → Make sure all 4 Clerk env vars (sign-in/up URLs) are set correctly.

**MongoDB connection fails** → Check IP whitelist in Atlas and correct password in URI.

---

## 🏆 Hackathon Highlights to Mention

1. **22 Indian language support** — Sarvam AI powers multilingual TTS & translation
2. **Real-time voice AI** — Vapi enables natural conversations with any book
3. **Auto quiz generation** — Perfect for UPSC/JEE/NEET/B.Tech students
4. **Progress tracking + analytics** — Gamified learning experience
5. **Public library** — Community book sharing between students

---

*Built as part of SPECTRUM by Aprajita Ranjan (Riya) — VIT Bhopal, 2025*
