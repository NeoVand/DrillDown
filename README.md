# Drill Down - AI-Powered Root Cause Analysis Tool

Drill Down is a modern, AI-integrated application designed to streamline the Root Cause Analysis (RCA) process. It helps users analyze problems, identify root causes, and generate comprehensive reports and presentations.

![Drill Down Screenshot](screenshot.png)

## Features

- **Why-Because Graph Construction**: Easily build visual diagrams to analyze causes and relationships
- **AI-Assisted Analysis**: Get suggestions for potential causes, evidence gathering, and diagram improvements
- **Markdown Report Generation**: Create detailed RCA reports with AI assistance
- **Executive Summary Slides**: Generate presentation slides for stakeholders
- **Data Persistence**: Save and load projects securely using browser's IndexedDB

## Technologies Used

- React + TypeScript
- Vite
- Material UI
- Tailwind CSS
- ReactFlow (for diagram creation)
- MDXEditor (for Markdown editing)
- Reveal.js (for slide presentations)
- Langchain + Ollama (for AI integration)
- Dexie.js (for IndexedDB management)

## Getting Started

### Prerequisites

- Node.js >= 16.x
- npm or yarn
- Ollama (for local LLM support)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/drill-down.git
   cd drill-down
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Setting up Ollama (for AI features)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the Llama 3 model:
   ```
   ollama pull llama3
   ```
3. Start the Ollama server:
   ```
   ollama serve
   ```

## Usage

1. Create a new project by clicking "new project"
2. Define your problem in the Diagram tab
3. Use the AI assistant to help identify potential causes
4. Build your Why-Because Graph by adding nodes and connections
5. Generate a comprehensive report in the Report tab
6. Create executive summary slides in the Slide tab
7. Export your analysis as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [ReactFlow](https://reactflow.dev)
- [Material UI](https://mui.com)
- [Langchain](https://js.langchain.com)
- [Ollama](https://ollama.ai)
- [MDXEditor](https://mdxeditor.dev)
- [Reveal.js](https://revealjs.com)
