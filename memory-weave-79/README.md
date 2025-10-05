# StoryNest for Grandparents

A beautiful web application that helps capture and preserve family memories through guided AI conversations. Turn life stories into shareable blog posts with secure family permissions.

## 🎯 Features

- **Guided Interview**: Empathetic AI interviewer helps storytellers share memories
- **Story Synthesis**: Automatically creates polished 300-450 word blog posts from conversations
- **Family Permissions**: Invite family members with role-based access (owner, editor, viewer)
- **Secure Sharing**: Generate expiring, revocable share links with audit logging
- **Edit & Export**: Edit posts, download as text files
- **Memory Gallery**: View all captured memories in one place
- **Real-time Chat**: Live conversation updates using Lovable Cloud Realtime

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

- `storytellers` - Profile information with owner tracking
- `stories` - Conversation sessions
- `messages` - Full transcripts with timestamps
- `posts` - Synthesized blog posts
- `shares` - Secure, expiring share tokens with revocation
- `memberships` - Family member invitations with role-based permissions
- `audit_logs` - Security audit trail for sensitive actions

## 🎨 Design Philosophy

- **Warm & Nostalgic**: Terracotta and sage color palette
- **Accessible**: Large 18px base font, high contrast
- **Simple**: Clean, focused interface
- **Respectful**: Privacy-first, gentle pace

## 🔒 Privacy & Security

- **Role-Based Access**: Owner, editor, and viewer roles for family members
- **Secure Tokens**: All share and invite tokens are hashed (SHA-256) before storage
- **Expiring Links**: Share links expire automatically (configurable 1-90 days)
- **Revocable Access**: Instantly revoke share links and memberships
- **Audit Logging**: Track all sensitive actions (invites, shares, revocations)
- **Token Security**: Single-use invite tokens with constant-time comparison
- **Data Privacy**: All data private by default, share only via secure links

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
Handles conversation flow with AI interviewer. Stores messages and returns empathetic responses using Lovable AI (Gemini 2.5 Flash).

### `/synthesize`
Processes full transcript and generates structured blog post using AI tool calling for JSON output.

### `/invite`
Creates secure, hashed invite tokens for family members. Sends email invitations with role-based permissions (7-day expiry).

### `/accept-invite`
Validates invite tokens, marks memberships as accepted, and creates audit log entries.

### `/revoke-share`
Revokes share links immediately and logs the action for security audit.

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

- **Email Notifications**: Send email invites via Resend/SendGrid integration
- **Audio Recording**: Voice recording with transcription
- **Photo Attachments**: Add images to memories
- **PDF Export**: Beautiful PDF export with styling
- **Authentication**: Full auth system with profiles
- **Rate Limiting**: Prevent abuse of AI endpoints
- **CSP Headers**: Content Security Policy implementation
- **Magic Link Auth**: Passwordless login for invited members

---

Built with ❤️ using Lovable
