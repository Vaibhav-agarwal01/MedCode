# ⚕️ MedCode

**MedCode** is an intelligent, AI-powered medical coding and claims processing platform. Leveraging the power of LangChain and Google's Generative AI, MedCode automates the extraction of medical codes, validates claims against Medicare compliance guidelines, and assists in generating appeal drafts for denied claims.

## ✨ Features

- **🧠 AI Data Extraction**: Automatically extracts relevant patient diagnoses and procedures using an intelligent Extraction Agent.
- **✅ Compliance Checking**: Verifies medical claims against standard Medicare guidelines using a dedicated Compliance Agent.
- **📝 Automated Appeals**: Generates professional, data-backed appeal letters for denied claims via the Appeal Agent.
- **⚡ Modern UI**: A fast, responsive, and intuitive frontend built with React 19, Vite, and Tailwind CSS.
- **🔒 Secure API**: Robust Express.js backend using Zod for payload validation and MongoDB for secure data persistence.

## 🛠️ Tech Stack

**Frontend:**
- [React 19](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide React](https://lucide.dev/) - Iconography

**Backend:**
- [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) - Server framework
- [MongoDB](https://www.mongodb.com/) & Mongoose - Database
- [LangChain (JS/TS)](https://js.langchain.com/) - LLM Orchestration
- [Google GenAI](https://ai.google.dev/) - Core language models
- [Zod](https://zod.dev/) - Schema validation

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas URL)
- A valid **Google Gemini API Key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vaibhav-agarwal01/MedCode.git
   cd MedCode
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on the provided `.env.example`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_gemini_api_key
```

### 🏃‍♂️ Running the Application

1. **Start the Backend Server** (from the `backend/` directory)
   ```bash
   npm run dev
   ```
   *Note: If you need to ingest the Medicare guidelines into your vector store, run `npm run ingest` first.*

2. **Start the Frontend Client** (from the `frontend/` directory)
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` (or the port Vite provides).

