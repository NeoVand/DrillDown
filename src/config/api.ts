// Base URL for Ollama API
export const OLLAMA_BASE_URL = 'http://localhost:11434';

// Function to make a fetch request with CORS headers
export const fetchWithCORS = async (path: string, options: RequestInit = {}) => {
  try {
    const url = `${OLLAMA_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error in fetchWithCORS:', error);
    throw error;
  }
};

// Function to check if Ollama is running
export const checkOllamaConnection = async (): Promise<{ connected: boolean; error?: string }> => {
  try {
    const response = await fetchWithCORS('/api/version');
    if (response.ok) {
      return { connected: true };
    } else {
      return { 
        connected: false, 
        error: `API responded with an error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    // Provide more specific error messages based on the error type
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { 
        connected: false, 
        error: `Cannot connect to Ollama server at ${OLLAMA_BASE_URL}. Make sure Ollama is installed and running.` 
      };
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        connected: false,
        error: 'Connection timed out. Ollama server may be starting up or experiencing issues.'
      };
    } else {
      return { 
        connected: false, 
        error: error instanceof Error ? 
          `Connection error: ${error.message}` : 
          'Unknown error connecting to Ollama' 
      };
    }
  }
};

// Function to get the command to start Ollama based on platform
export const getOllamaStartCommand = (): string => {
  const isWindows = navigator.platform.toLowerCase().includes('win');
  const isLocalNetwork = window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname);
  
  if (isLocalNetwork || isWindows) {
    return 'ollama serve';
  } else {
    return `OLLAMA_ORIGINS="${window.location.origin}" ollama serve`;
  }
};

// Function to stream chat completions from Ollama
export const streamOllamaChat = async (
  model: string,
  messages: {role: string, content: string}[],
  options: {
    temperature?: number;
    top_p?: number;
    seed?: number;
    num_ctx?: number;
  } = {},
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void
) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: options.temperature,
          top_p: options.top_p,
          seed: options.seed,
          num_ctx: options.num_ctx
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';

    const processStream = async () => {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(fullResponse);
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        
        try {
          // Split by newlines as each line is a separate JSON object
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line) {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                const content = parsed.message.content;
                fullResponse += content;
                onChunk(content);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing JSON from stream:', e);
        }
        
        // Continue reading
        processStream();
      } catch (error) {
        if (error instanceof Error) {
          onError(error);
        } else {
          onError(new Error('Unknown error during stream processing'));
        }
      }
    };

    processStream();

    // Return a function to abort the stream
    return () => {
      reader.cancel();
    };
  } catch (error) {
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('Unknown error during stream setup'));
    }
    return () => {}; // Return empty abort function
  }
}; 