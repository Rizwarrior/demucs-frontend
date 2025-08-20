---
title: Demucs Music Source Separation
emoji: 🎵
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
license: mit
---

# Demucs Music Source Separation

An AI-powered web application for separating music into individual stems (vocals, drums, bass, other) using Meta's Demucs model.

## Features

- 🎵 **High-Quality Separation**: Uses the latest Demucs htdemucs model for superior audio separation
- 🎨 **Beautiful UI**: Modern React interface with real-time progress tracking
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Processing**: Optimized for quick audio processing
- 💾 **Easy Download**: Download individual stems as WAV files

## Supported Audio Formats

- MP3
- WAV
- FLAC
- OGG
- M4A
- AAC

## How to Use

1. **Upload** your audio file using the drag-and-drop interface
2. **Wait** for the AI to process and separate the audio (progress bar shows status)
3. **Listen** to individual stems using the built-in audio players
4. **Download** the separated tracks you want to keep

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Flask + Python
- **AI Model**: Meta's Demucs (Hybrid Transformer)
- **Audio Processing**: PyTorch + TorchAudio
- **Deployment**: Docker + Hugging Face Spaces

## Local Development

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start development servers
npm run dev          # Frontend (port 3001)
python server.py     # Backend (port 5000)
```

## Credits

- [Demucs](https://github.com/facebookresearch/demucs) by Meta Research
- Built with ❤️ for the music community

## License

MIT License - feel free to use and modify!