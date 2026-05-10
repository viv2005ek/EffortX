# EffortX AI Analyzer Backend

This is the off-chain AI verification service for **EffortX**, an AI-powered developer reputation platform. It analyzes GitHub contributions using Gemini AI to generate effort scores and insights.

## Features
- **GitHub Integration**: Fetches data for both Commits and Pull Requests.
- **AI Analysis**: Uses Gemini 2.5 (1.5 Flash/Pro) for deep technical evaluation.
- **Scoring System**: Generates effort scores (0-1000) based on complexity and impact.
- **Reward Logic**: Calculates EffortX reward coins.
- **Modular Architecture**: Clean separation of concerns (Controllers, Services, Utils).

## Tech Stack
- Node.js & Express.js
- Axios (GitHub API)
- @google/generative-ai (Gemini API)
- dotenv & CORS
- Morgan (Logging)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file (template provided) and add your keys:
   - `GITHUB_TOKEN`: GitHub Personal Access Token (for higher rate limits).
   - `GEMINI_API_KEY`: Google Gemini API Key.
   - `PORT`: Server port (default 5000).

3. **Run the Server**:
   ```bash
   # Production mode
   npm start
   
   # Development mode (with watch)
   npm run dev
   ```

## API Endpoints

### 1. Health Check
`GET /api/health`
- Returns the service status.

### 2. Analyze Contribution
`POST /api/analyze`
- **Body**:
  ```json
  {
    "githubUrl": "https://github.com/user/repo/commit/abc..."
  }
  ```
  *Supports both commit and PR links.*

- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "type": "commit",
      "repository": "repo-name",
      "author": "username",
      "effortScore": 842,
      "rewardCoins": 120,
      "summary": "Implemented JWT auth...",
      ...
    }
  }
  ```

## Project Structure
- `/src/controllers`: Request handlers.
- `/src/services`: Business logic (GitHub, Gemini, Scoring).
- `/src/utils`: Helper functions (URL parsing).
- `/src/prompts`: AI system prompts.
- `/src/routes`: API route definitions.
