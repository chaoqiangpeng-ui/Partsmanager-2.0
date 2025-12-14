# LifeCycle Pro - Industrial Parts Management System

![Project Banner](https://via.placeholder.com/1200x300/0f172a/ffffff?text=LifeCycle+Pro+Dashboard)

**LifeCycle Pro** is a comprehensive industrial parts management system designed to track component lifetimes, installation dates, and maintenance schedules with AI-powered insights.

Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## ✨ Features

- **📊 Interactive Dashboard**: Real-time overview of fleet health, KPI cards, and visual charts.
- **🤖 AI Analysis**: Integrated Gemini AI to analyze fleet data and generate maintenance reports.
- **🏭 Machine Management**: Track equipment location, model, and status (Active/Maintenance/Offline).
- **🔧 Parts Inventory**: detailed catalog of component types with lifetime tracking and cost analysis.
- **⚡ Real-time Health Tracking**: Visual progress bars showing component degradation based on installation dates.
- **📝 Maintenance History**: Full log of part replacements and maintenance actions.

## 📸 Screenshots

> *Add your screenshots here to let visitors preview the app without running it.*

### Dashboard Overview
![Dashboard](https://via.placeholder.com/800x450/f1f5f9/94a3b8?text=Dashboard+Screenshot)

### Machine Management
![Machine View](https://via.placeholder.com/800x450/f1f5f9/94a3b8?text=Machine+List+Screenshot)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lifecycle-pro.git
   cd lifecycle-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add your Google Gemini API Key:
   ```env
   API_KEY=your_google_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url (Optional)
   VITE_SUPABASE_KEY=your_supabase_key (Optional)
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## ☁️ Deployment (Vercel + Supabase)

### 1. Database Setup (Supabase)
1. Create a new project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase.
3. Copy the content from `deployment/supabase_schema.sql` in this repository.
4. Run the SQL script to create tables and set permissions.
5. Go to **Settings -> API** and copy the `URL` and `anon public` Key.

### 2. Hosting Setup (Vercel)
1. Import this repository into [Vercel](https://vercel.com).
2. In the "Environment Variables" section, add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_KEY`: Your Supabase Anon Key
   - `API_KEY`: Your Gemini API Key
3. Click **Deploy**.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Charts**: Recharts
- **AI Integration**: Google GenAI SDK
- **Data Persistence**: Supabase (Optional/Mock Mode available)

## 👤 Author

**Chaoqiang**
- Admin Access
- Version: v1.3

---
*LifeCycle Pro v1.3*
