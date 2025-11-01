# HR Soft

A modern HR management demo built with React, Vite, and Tailwind CSS. The application showcases role-based navigation, bilingual authentication, and a responsive dashboard layout.

Key modules include:

- **Ticket desk:** capture employee requests, track progress, and resolve blockers from a centralized workflow.
- **User management:** onboard new teammates with role assignments and phone details.
- **Role & permission management:** build bespoke roles, assign granular permissions, and audit access from a single matrix.
- **Employee profile:** let teammates update their contact details and rotate passwords without leaving the dashboard.

## Getting Started

```bash
npm install
npm run dev
```

The site is available at [http://localhost:5173](http://localhost:5173).

## Available Scripts

- `npm run dev` – start the development server.
- `npm run build` – type-check and create a production build.
- `npm run preview` – preview the production build locally.

## Demo Accounts

Use one of the demo accounts below to sign in:

| Role      | Email         | Password |
|-----------|---------------|----------|
| Admin     | admin@hr.com  | admin123 |
| HR        | hr@hr.com     | hr123    |
| Employee  | user@hr.com   | user123  |

## Project Structure

```
hr-soft/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginView.tsx
│   │   └── layout/
│   │       ├── DashboardLayout.tsx
│   │       └── MainLayout.tsx
│   ├── constants/
│   │   └── permissions.ts
│   ├── context/
│   │   └── AppContext.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── PermissionsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── RolesPage.tsx
│   │   ├── TicketsPage.tsx
│   │   └── UsersPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── storage.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── database/
│   └── hr_soft.sql
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.cjs
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Exporting or Uploading the Project

## Database Seed

An SQL dump that mirrors the in-app seed data is available at
`database/hr_soft.sql`. Import it with phpMyAdmin or the MySQL CLI:

```sql
SOURCE /path/to/database/hr_soft.sql;
```

The script creates the `hr_soft` schema, tables for roles, permissions,
role assignments, users (with phone numbers), service tickets, and an empty
sessions table, then populates it with the same demo records used by the React
app.

### Option 1 – Download everything as a single archive

1. From the repository root, package the current commit into a zip file:
   ```bash
   git archive --format zip HEAD -o hr-soft.zip
   ```
   You can also use `zip -r hr-soft.zip . -x "node_modules/*"` if the `zip`
   CLI is available.
2. Transfer the archive to your machine. Common options include:
   - Using the VS Code/JetBrains download button that appears next to the file
     in the file tree.
   - Running a temporary HTTP server and visiting it from your browser:
     ```bash
     python -m http.server 8000
     ```
     Then open [http://localhost:8000/hr-soft.zip](http://localhost:8000/hr-soft.zip)
     in your browser to download the file.
   - Using `scp` or `docker cp` if you are connected via SSH or Docker.

Once the archive is on your computer, unzip it and run `npm install` followed by
`npm run dev` to start developing locally.

### Option 2 – Push the project to your own GitHub repository

1. [Create a new empty repository on GitHub](https://github.com/new) without
   initializing it with a README or `.gitignore`.
2. If you have not already, configure your Git username and email:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
3. Add the new GitHub repository as a remote and verify the branch name:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   ```
4. Push all existing commits to GitHub:
   ```bash
   git push -u origin main
   ```
5. (Optional) On another machine, clone the repository with:
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   ```

After the push finishes, the complete project—including commit history—will be
available on GitHub. Anyone you share the URL with can either clone it or use
GitHub’s **Code → Download ZIP** button to grab the entire project at once.

## License

This project is provided for demonstration purposes.
