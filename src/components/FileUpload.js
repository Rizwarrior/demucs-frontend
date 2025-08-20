import React, { useState, useRef } from 'react';
import { Upload, Music, FileAudio } from 'lucide-react';
import './FileUpload.css';

const FileUpload = ({ onFileUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('audio/')) {
      onFileUpload(file);
    } else {
      alert('Please select a valid audio file (MP3, WAV, FLAC, etc.)');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          <div className="upload-icon">
            <Upload size={48} />
          </div>
          
          <h2>Upload Your Music</h2>
          <p>Drag and drop an audio file here, or click to browse</p>
          
          <div className="supported-formats">
            <div className="format-item">
              <FileAudio size={20} />
              <span>MP3</span>
            </div>
            <div className="format-item">
              <FileAudio size={20} />
              <span>WAV</span>
            </div>
            <div className="format-item">
              <FileAudio size={20} />
              <span>FLAC</span>
            </div>
            <div className="format-item">
              <Music size={20} />
              <span>More</span>
            </div>
          </div>
          
          <button className="upload-button">
            Choose File
          </button>
        </div>
      </div>
      
      <div className="info-section">
        <h3>How it works</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <p>Upload your audio file</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <p>AI separates the tracks</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <p>Download isolated stems</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;