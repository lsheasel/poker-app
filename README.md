# 🃏 Poker4Fun

A modern web-based Texas Hold'em Poker game with real-time multiplayer, 3D card effects, team management, and user authentication.

---

## 🚀 Features

- **Real-Time Multiplayer:** Play Texas Hold'em live with friends or other players via Socket.IO.
- **Texas Hold'em Logic:** Full game rules and betting flow implemented.
- **3D Card Effects:** Interactive card rotation and shake on hover.
- **Team Panel:** Create and manage teams (feature in development).
- **User Authentication:** Secure login and profiles via Supabase.
- **Custom Avatars & Card Skins:** Personalize your poker experience.
- **Sound & Music:** Table music and sound effects for actions.
- **Responsive Design:** Works on desktop and mobile.
- **Confetti & Visual Effects:** Celebrate wins with animations.
- **Quick Bet Options:** Fast betting controls for smooth gameplay.

---

## ⚠️ Features in Development

Some features are not fully implemented yet:
- Team chat and tournaments
- Advanced statistics and hand history
- Friend system and private rooms
- More card skins and table themes

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v14+)
- npm
- [Supabase account](https://supabase.com/) (for authentication & user data)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd poker-app
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com/).
2. Get your Supabase URL and anon/public key.
3. In the Supabase SQL editor, run:

```sql
-- Users Table
create table public.users (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  card_skin text default 'modern'
);

-- Teams Table
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  name text unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Team Members Table
create table public.team_members (
  team_id uuid references public.teams(id),
  user_id uuid references public.users(id),
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (team_id, user_id)
);
```

### 3. Environment Variables

Create a `.env` file in both `/client` and `/server`:

**/client/.env**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SOCKET_URL=http://localhost:3001
```

**/server/.env**
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 4. Install Dependencies

```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

### 5. Start Development

```bash
# In one terminal (client)
cd client
npm run dev

# In another terminal (server)
cd server
npm run dev
```

---

## 🎮 Controls

- **Mouse:** Hover cards for 3D effect, click to bet/call/fold.
- **Keyboard:**  
  - `C` = Call  
  - `F` = Fold  
  - `Enter` = Confirm bet  
  - `ESC` = Open menu

---

## 📁 Project Structure

```
poker-app/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── socket/
│   └── public/
│       ├── skins/
│       └── sounds/
└── server/
    ├── src/
    │   ├── game/
    │   └── socket/
    └── index.js
```

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## ℹ️ Notes

- Some features (team panel, chat, tournaments, advanced stats) are still in development.
- For questions or issues, please open an issue on GitHub.

---

Enjoy editing Poker4Fun! 🃏
