# Memory Keeper for Grandparents

A beautiful web application that helps capture and preserve family memories through guided AI conversations. Turn life stories into shareable blog posts.

## 🎯 Features

- **Guided Interview**: Empathetic AI interviewer helps storytellers share memories
- **Story Synthesis**: Automatically creates polished 300-450 word blog posts from conversations
- **Edit & Share**: Edit posts, download as text files, and generate private share links
- **Memory Gallery**: View all captured memories in one place
- **Real-time Chat**: Live conversation updates using Supabase Realtime

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with warm, accessible design system
- **Backend**: Lovable Cloud (Supabase)
  - PostgreSQL database
  - Edge Functions for AI processing
  - Realtime subscriptions
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)

## 🚀 Getting Started

1. **Start a New Memory**
   - Enter storyteller's name
   - Begin guided conversation

2. **Share Your Story**
   - Answer simple questions
   - AI gently prompts for details
   - Take your time—no rush

3. **Create Your Post**
   - Click "Create Post" when ready
   - AI synthesizes conversation into blog post
   - Includes pull quotes and tags

4. **Share with Family**
   - Edit title and content
   - Download or create share link
   - Family views via private URL

## 📊 Database Schema

- `storytellers` - Profile information
- `stories` - Conversation sessions
- `messages` - Full transcripts with timestamps
- `posts` - Synthesized blog posts
- `shares` - Private share tokens

## 🎨 Design Philosophy

- **Warm & Nostalgic**: Terracotta and sage color palette
- **Accessible**: Large 18px base font, high contrast
- **Simple**: Clean, focused interface
- **Respectful**: Privacy-first, gentle pace

## 🔒 Privacy & Security

- All data private by default
- Share only via generated private links
- Delete functionality removes all data
- Public RLS policies (can be tightened for auth)

## 🎭 Demo Flow (2 minutes)

1. Show homepage and privacy commitment
2. Create profile "Siti"
3. Quick conversation with sample memory
4. Click "Synthesize" → show generated post
5. Edit, export, create share link
6. Open share link in incognito

## 📝 Sample Memory

**Storyteller**: When I was seven I fell into the river near my house in Yogyakarta. My friend Budi pulled me out. I remember the cold water and the smell of wet earth.

**Generated Post**: Warm 350-word story with sensory details, quotes, and reflections.

## 🎯 Acceptance Criteria

✅ Chat captures and stores messages with speaker tags  
✅ Synthesis returns valid structured JSON  
✅ Posts render, can be edited, saved, and exported  
✅ Share URLs work without authentication  
✅ Privacy: delete endpoint removes all data  

## 🔧 Environment Variables

All automatically configured via Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY` (server-side)

## 📦 Edge Functions

### `/chat`
Handles conversation flow with AI interviewer. Stores messages and returns empathetic responses.

### `/synthesize`
Processes full transcript and generates structured blog post using AI tool calling for JSON output.

## 🎨 Color Palette

- Primary: `hsl(15 55% 48%)` - Warm terracotta
- Secondary: `hsl(120 15% 58%)` - Soft sage
- Background: `hsl(42 47% 95%)` - Warm cream
- Accent: `hsl(15 70% 60%)` - Bright coral

## 📱 Responsive Design

- Mobile-first approach
- Large touch targets
- Readable on all devices
- Optimized for tablets

## 🚀 Deployment

Built on Lovable - automatically deployed on save. Backend functions deploy automatically.

## 🎓 Next Features

- Audio recording + transcription
- Photo attachments
- PDF export with styling
- Family accounts with auth
- Email notifications
- Print-ready formats

---

Built with ❤️ using Lovable
