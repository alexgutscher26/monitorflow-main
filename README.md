# PingPanda - A Modern Fullstack Event Monitoring SaaS

A powerful event monitoring and notification system built with Next.js 14, React, TypeScript, Tailwind CSS, and more.

![Project Image](https://github.com/joschan21/pingpanda/blob/main/public/thumbnail.png)

## 🌟 Features

- 🛠️ Complete SaaS built with modern Next.js 14 App Router
- 💻 Beautiful, responsive landing page
- 🎨 Custom professional illustrations and UI components
- ✉️ Real-time event notifications via Discord
- 🖥️ Clean & intuitive event monitoring dashboard
- 💳 Secure payment processing with Stripe
- 🛍️ Subscription management with PRO plan features
- 🌟 Modern UI built on top of shadcn/ui
- 🔑 Authentication using Clerk
- ⌨️ Keyboard shortcuts for improved productivity
- 📊 Event categorization and organization
- 🔄 Real-time updates with React Query
- 🔒 Rate limiting and quota management
- 📱 Fully responsive design
- ⌨️ 100% TypeScript codebase
- 🎁 ...and much more!

## 🚀 Tech Stack

- **Frontend**: React, Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Hono, Cloudflare Workers
- **Database**: PostgreSQL (via Neon), Prisma ORM
- **Authentication**: Clerk
- **State Management**: React Query
- **Payments**: Stripe
- **Notifications**: Discord API
- **Caching**: Upstash Redis
- **Deployment**: Vercel (frontend), Cloudflare Workers (backend functions)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or Neon serverless Postgres)
- Clerk account for authentication
- Discord application for notifications
- Stripe account for payments

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/monitorflow-main.git
cd monitorflow-main
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required environment variables

4. Set up the database:

```bash
pnpm prisma migrate dev
```

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📖 API Usage

MonitorFlow provides a simple API for sending events:

```typescript
// Example API call to send an event
const response = await fetch('https://your-domain.com/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'User Signup',
    categoryId: 'category_id',
    fields: {
      userId: '123',
      email: 'user@example.com',
      plan: 'free'
    }
  })
});
```

## ⌨️ Keyboard Shortcuts

MonitorFlow includes keyboard shortcuts to improve productivity:

| Shortcut | Action |
|----------|--------|
| `Alt + N` | Create a new event category |
| `Alt + R` | Refresh dashboard data |
| `Alt + T` | Toggle between light and dark mode |
| `Alt + D` | Navigate to dashboard |
| `Alt + S` | Navigate to settings |
| `Alt + A` | Navigate to account |
| `Alt + H` | Show keyboard shortcuts help |

You can also access the keyboard shortcuts help by clicking the "Keyboard Shortcuts" button in the dashboard header.

## 📁 Project Structure

```
monitorflow/
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── server/            # Server-side code
│   └── middleware.ts      # Next.js middleware
├── .env.example           # Example environment variables
├── next.config.mjs        # Next.js configuration
└── package.json           # Project dependencies
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Clerk](https://clerk.com/) for authentication
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Prisma](https://www.prisma.io/) for database ORM
- [Next.js](https://nextjs.org/) for the framework
- [Stripe](https://stripe.com/) for payment processing
- [Discord](https://discord.com/) for notifications
