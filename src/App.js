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
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

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