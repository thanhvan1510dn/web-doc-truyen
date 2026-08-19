# Antigravity Agent Guidelines - Web Đọc Truyện Ecosystem

> **Active Workspace Conversation**: [5e536b41-0ee5-4be7-8314-b1dc3fd2baf7](conversation://5e536b41-0ee5-4be7-8314-b1dc3fd2baf7)

## 📌 Project Overview
- **User Web (`web-doc-truyen`)**: Frontend React 18 + Vite + Tailwind CSS for novel readers.
  - Production URL: `https://web-doc-truyen-theta.vercel.app`
- **Admin Portal (`admin-web-doc-truyen`)**: Management UI for adding/editing novels, volumes, chapters, and uploading PDF/Word/TXT files.
  - Production URL: `https://admin-web-doc-truyen.vercel.app`
- **Database**: Google Cloud Firestore (Project ID: `web-truyen-6bac3`).
  - Real-time `onSnapshot` listener handles automatic live sync between Admin and User Web.

## 🛠️ Architecture Rules
1. **Cloud Firestore Serialization**: Always sanitize documents before `setDoc` with `JSON.parse(JSON.stringify(data))` to ensure no `undefined` values are sent.
2. **Volume / Section Titles**: Always render `volume.title` directly without hardcoded "Quyển X:" prefixes to prevent title duplication.
3. **Story Description Links**: Văn án supports clickable links (both raw `https://...` and markdown `[Text](https://...)`).
4. **Clean Admin Auth**: Login form starts with empty fields and no default credentials.