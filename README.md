# Notion-like Workspace

A modern, markdown-enabled workspace application built with React and TypeScript, inspired by Notion's interface and functionality.

## Features

- **Project Management**: Create and organize multiple projects
- **Hierarchical Pages**: Create sub-pages with unlimited nesting levels
- **Page Linking**: Link between pages within and across projects
- **Markdown Support**: Full markdown editing with live preview
- **Split View**: Toggle between editor-only and split editor/preview modes
- **Interactive Navigation**: Click page links to navigate between pages
- **User Authentication**: JWT-based sign in/up system
- **Version History**: Track all changes with GitHub-like history view
- **Real-time Collaboration**: Live editing with WebSocket synchronization
- **Change Tracking**: Know who changed what and when
- **Version Restore**: Restore any previous version of a page
- **Permission System**: Project-level access control (owner/editor/viewer)
- **Live Presence**: See who's online and editing what
- **Real-time Cursors**: See other users' cursor positions
- **Typing Indicators**: Know when others are typing
- **Modern UI**: Clean, Notion-inspired interface
- **Responsive Design**: Works on desktop and mobile devices
- **Backend API**: Full REST API with MongoDB database
- **WebSocket Support**: Real-time collaboration features

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Quick Start

1. **Clone and setup**:
```bash
git clone <your-repo-url>
cd notion-workspace
```

2. **Install dependencies**:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Configure environment**:
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/notion-workspace
# JWT_SECRET=your-super-secret-jwt-key-here
```

4. **Start development servers**:
```bash
# Option 1: Use the start script (recommended)
./start-dev.sh

# Option 2: Start manually
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

5. **Open your browser**: `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

### Getting Started
1. **Sign In**: Click the "Sign In" button in the header to create an account or sign in
2. **Create Project**: Click the "+" button in the sidebar header
3. **Type project name** and press Enter
4. The project will be created and selected automatically

### Adding Pages
1. Click on a project to expand it
2. Click "Add page" at the bottom of the project
3. Enter a page title when prompted
4. Start writing in markdown format

### Creating Sub-pages
1. While editing a page, click the "Link" button in the header
2. Click "Create Sub-page" to create a child page
3. Enter the sub-page title
4. The sub-page will be automatically linked and appear in the sidebar hierarchy

### Creating Page Links
1. While editing a page, click the "Link" button in the header
2. Enter link text and search for an existing page to link to
3. Click "Create Link" to add the link to your content
4. Links appear as clickable buttons in the preview

### Editing Content
- Click on any page to start editing
- Use standard markdown syntax for formatting
- Toggle split view to see live preview alongside the editor
- Click on page titles to rename them
- Click on page links in the preview to navigate to linked pages

### Version History
1. While editing a page, click the "History" button in the header
2. View all versions of the page with timestamps and authors
3. Click on any version to see the changes
4. Use the "Restore" button to revert to a previous version
5. See who made what changes and when

### Collaboration
- See online collaborators in the header status
- All changes are tracked with user attribution
- Version history shows who made each change
- Real-time collaboration status (online/offline)

### Navigation
- Click on projects in the sidebar to expand/collapse them
- Click on pages to switch between them
- Use the split view button to toggle between editor and preview modes
- Click page links in the content to navigate between pages
- Sub-pages are displayed with indentation in the sidebar
- Pages with links show a link indicator icon

## Markdown Features

The editor supports standard markdown syntax including:
- Headers (# ## ###)
- Bold and italic text
- Lists (ordered and unordered)
- Links and images
- Code blocks and inline code
- Tables
- Blockquotes
- And more via GitHub Flavored Markdown

### Page Links

The editor supports special page links using the syntax:
```markdown
[Link Text](page:pageId)
```

These links are automatically converted to clickable buttons that navigate to the target page. You can create these links using the Link button in the header.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (VS Code's editor)
- **React Markdown** - Markdown rendering
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Icons
- **CSS3** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - WebSocket library
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Deployment
- **MongoDB Atlas** - Database hosting
- **Railway/Vercel** - Application hosting
- **Docker** - Containerization (optional)

## Project Structure

```
notion-workspace/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── Sidebar.tsx     # Project and page navigation
│   │   ├── Header.tsx      # Top navigation bar
│   │   ├── MainContent.tsx # Main content area
│   │   ├── MarkdownEditor.tsx # Markdown editor
│   │   ├── UserAuth.tsx    # User authentication
│   │   ├── VersionHistory.tsx # Version history viewer
│   │   └── CollaborationStatus.tsx # Real-time status
│   ├── context/            # React context
│   │   └── WorkspaceContext.tsx
│   ├── services/           # API and Socket services
│   │   ├── api.js          # REST API client
│   │   └── socket.js       # WebSocket client
│   ├── types.ts           # TypeScript definitions
│   └── App.tsx            # Main app component
├── backend/                # Backend source code
│   ├── models/            # Database models
│   │   ├── User.js        # User model
│   │   ├── Project.js     # Project model
│   │   ├── Page.js        # Page model
│   │   ├── PageVersion.js # Version model
│   │   └── PageLink.js    # Link model
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── projects.js    # Project routes
│   │   └── pages.js       # Page routes
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # JWT authentication
│   │   └── permissions.js # Access control
│   ├── socket/            # WebSocket handlers
│   │   └── socketHandlers.js
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── DEPLOYMENT.md          # Deployment guide
└── README.md             # This file
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
