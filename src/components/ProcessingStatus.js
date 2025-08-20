import React from 'react';
import { Loader2, Music } from 'lucide-react';
import './ProcessingStatus.css';

const ProcessingStatus = ({ progress, fileName }) => {
  return (
    <div className="processing-container">
      <div className="processing-card">
        <div className="processing-header">
          <div className="processing-icon">
            <Loader2 size={32} className="spinner" />
          </div>
          <h2>Processing Your Music</h2>
          <p>AI is separating your audio into individual tracks...</p>
        </div>

        <div className="file-info">
          <Music size={20} />
          <span className="file-name">{fileName}</span>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {Math.round(progress)}% Complete
          </div>
        </div>

        <div className="processing-steps">
          <div className={`step ${progress > 20 ? 'completed' : 'active'}`}>
            <div className="step-dot"></div>
            <span>Loading audio</span>
          </div>
          <div className={`step ${progress > 40 ? 'completed' : progress > 20 ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Analyzing frequencies</span>
          </div>
          <div className={`step ${progress > 70 ? 'completed' : progress > 40 ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Separating sources</span>
          </div>
          <div className={`step ${progress > 90 ? 'completed' : progress > 70 ? 'active' : ''}`}>
            <div className="step-dot"></div>
            <span>Finalizing tracks</span>
          </div>
        </div>

        <div className="estimated-time">
          <p>This usually takes 1-3 minutes depending on song length</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;