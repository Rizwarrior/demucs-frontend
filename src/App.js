import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import AudioPlayer from './components/AudioPlayer';
import ProcessingStatus from './components/ProcessingStatus';
import Header from './components/Header';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [separatedTracks, setSeparatedTracks] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    const formData = new FormData();
    formData.append('audio', file);

    try {
      // Simulate smooth progress updates with exponential decay
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const elapsed = Date.now() - startTime;
          // Use exponential approach to 95% over time, then slow crawl to 98%
          let targetProgress;
          if (elapsed < 30000) { // First 30 seconds: quick progress to 95%
            targetProgress = 95 * (1 - Math.exp(-elapsed / 10000));
          } else { // After 30 seconds: slow crawl from 95% to 98%
            const extraTime = elapsed - 30000;
            targetProgress = 95 + 3 * (1 - Math.exp(-extraTime / 20000));
          }
          
          // Smooth transition towards target
          const diff = targetProgress - prev;
          const increment = Math.max(0.1, diff * 0.1); // At least 0.1% progress each update
          
          return Math.min(98, prev + increment);
        });
      }, 500); // Update every 500ms for smoother animation

      const response = await fetch('/api/separate', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setSeparatedTracks(result.tracks);
      setProcessingProgress(100);
      
      // Store session ID for cleanup
      window.currentSessionId = result.session_id;
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async () => {
    // Clean up the current session if it exists
    if (separatedTracks && window.currentSessionId) {
      try {
        await fetch(`/api/cleanup/${window.currentSessionId}`, {
          method: 'POST'
        });
      } catch (error) {
        console.warn('Failed to cleanup session:', error);
      }
    }
    
    setUploadedFile(null);
    setSeparatedTracks(null);
    setIsProcessing(false);
    setProcessingProgress(0);
    setError(null);
    window.currentSessionId = null;
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        {!uploadedFile && !separatedTracks && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}

        {isProcessing && (
          <ProcessingStatus 
            progress={processingProgress}
            fileName={uploadedFile?.name}
          />
        )}

        {error && (
          <div className="error-container">
            <div className="error-message">
              <h3>Processing Error</h3>
              <p>{error}</p>
              <button onClick={handleReset} className="retry-button">
                Try Again
              </button>
            </div>
          </div>
        )}

        {separatedTracks && !isProcessing && (
          <AudioPlayer 
            key={uploadedFile?.name || 'default'}
            tracks={separatedTracks}
            originalFileName={uploadedFile?.name}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}

export default App;