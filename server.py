from flask import Flask, request, jsonify, send_file, Response, send_from_directory
from flask_cors import CORS
import os
import subprocess
import tempfile
import shutil
from werkzeug.utils import secure_filename
import uuid
from pathlib import Path
import time
import io

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app)

# Configuration
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'}

# Store separated tracks in memory temporarily
active_sessions = {}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def cleanup_old_sessions():
    """Clean up sessions older than 1 hour"""
    current_time = time.time()
    expired_sessions = []
    
    for session_id, session_data in active_sessions.items():
        if session_data.get('created_at', 0) < current_time - 3600:  # 1 hour
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        if session_id in active_sessions:
            # Clean up temporary directory if it exists
            temp_dir = active_sessions[session_id].get('temp_dir')
            if temp_dir and os.path.exists(temp_dir):
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
            del active_sessions[session_id]

@app.route('/api/separate', methods=['POST'])
def separate_audio():
    try:
        # Clean up old sessions
        cleanup_old_sessions()
        
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file format'}), 400
        
        # Generate unique ID for this processing session
        session_id = str(uuid.uuid4())
        
        # Create temporary directory for this session
        temp_dir = tempfile.mkdtemp(prefix=f"demucs_{session_id}_")
        
        try:
            # Save uploaded file to temp directory with clean filename
            original_filename = secure_filename(file.filename)
            # Remove any problematic characters and ensure proper extension
            base_name = os.path.splitext(original_filename)[0]
            extension = os.path.splitext(original_filename)[1].lower()
            
            # Clean the base name to avoid issues
            import re
            clean_base = re.sub(r'[^\w\-_\.]', '_', base_name)
            filename = f"{clean_base}{extension}"
            
            file_path = os.path.join(temp_dir, filename)
            file.save(file_path)
            
            # Add FFmpeg to PATH if it exists in the project directory
            env = os.environ.copy()
            ffmpeg_path = os.path.join(os.getcwd(), 'ffmpeg-7.1.1-essentials_build', 'bin')
            if os.path.exists(ffmpeg_path):
                env['PATH'] = ffmpeg_path + os.pathsep + env.get('PATH', '')
            
            # Run demucs command with output to temp directory
            output_dir = os.path.join(temp_dir, 'separated')
            cmd = ['demucs', '--device', 'cpu', '--out', output_dir, file_path]
            
            result = subprocess.run(cmd, capture_output=True, text=True, env=env)
            
            if result.returncode != 0:
                # Combine both stdout and stderr for complete error info
                error_output = ""
                if result.stdout:
                    error_output += f"STDOUT: {result.stdout}\n"
                if result.stderr:
                    error_output += f"STDERR: {result.stderr}"
                
                # Also log the full error for debugging
                print(f"Demucs failed with return code {result.returncode}")
                print(f"Full error output: {error_output}")
                
                return jsonify({'error': f'Demucs processing failed with return code {result.returncode}: {error_output}'}), 500
            
            # Find the output directory (Demucs creates subdirectories)
            base_name = os.path.splitext(filename)[0]
            track_dir = None
            
            # Look for the output directory
            for model_dir in os.listdir(output_dir):
                model_path = os.path.join(output_dir, model_dir)
                if os.path.isdir(model_path):
                    for potential_track_dir in os.listdir(model_path):
                        if potential_track_dir == base_name:
                            track_dir = os.path.join(model_path, potential_track_dir)
                            break
                    if track_dir:
                        break
            
            if not track_dir or not os.path.exists(track_dir):
                return jsonify({'error': 'Output files not found'}), 500
            
            # Read separated tracks into memory
            tracks = {}
            track_files = ['vocals.wav', 'drums.wav', 'bass.wav', 'other.wav']
            track_data = {}
            
            for track_file in track_files:
                track_path = os.path.join(track_dir, track_file)
                if os.path.exists(track_path):
                    track_name = track_file.replace('.wav', '')
                    
                    # Read file into memory
                    with open(track_path, 'rb') as f:
                        track_data[track_name] = f.read()
                    
                    # Create a URL that the frontend can use to download the file
                    tracks[track_name] = f'/api/download/{session_id}/{track_name}'
            
            if not tracks:
                return jsonify({'error': 'No separated tracks found'}), 500
            
            # Store session data in memory
            active_sessions[session_id] = {
                'tracks': track_data,
                'original_filename': original_filename,  # Use original filename for display
                'created_at': time.time(),
                'temp_dir': temp_dir
            }
            
            return jsonify({
                'success': True,
                'tracks': tracks,
                'session_id': session_id
            })
            
        except Exception as e:
            # Clean up temp directory on error
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return jsonify({'error': f'Processing error: {str(e)}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/download/<session_id>/<track_name>')
def download_track(session_id, track_name):
    try:
        # Check if session exists
        if session_id not in active_sessions:
            return jsonify({'error': 'Session not found or expired'}), 404
        
        session_data = active_sessions[session_id]
        
        # Check if track exists
        if track_name not in session_data['tracks']:
            return jsonify({'error': 'Track not found'}), 404
        
        # Get track data from memory
        track_data = session_data['tracks'][track_name]
        original_filename = session_data['original_filename']
        
        # Create a file-like object from the binary data
        track_io = io.BytesIO(track_data)
        
        # Generate download filename
        base_name = os.path.splitext(original_filename)[0]
        download_filename = f"{base_name}_{track_name}.wav"
        
        return send_file(
            track_io,
            as_attachment=True,
            download_name=download_filename,
            mimetype='audio/wav'
        )
        
    except Exception as e:
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/api/cleanup/<session_id>', methods=['POST'])
def cleanup_session(session_id):
    """Manually clean up a session when user is done"""
    try:
        if session_id in active_sessions:
            # Clean up temporary directory
            temp_dir = active_sessions[session_id].get('temp_dir')
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            
            # Remove from active sessions
            del active_sessions[session_id]
            
            return jsonify({'success': True, 'message': 'Session cleaned up'})
        else:
            return jsonify({'error': 'Session not found'}), 404
            
    except Exception as e:
        return jsonify({'error': f'Cleanup error: {str(e)}'}), 500

@app.route('/api/health')
def health_check():
    active_count = len(active_sessions)
    return jsonify({
        'status': 'healthy', 
        'message': 'Demucs API is running',
        'active_sessions': active_count
    })

# Serve React App
@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 7860))  # Hugging Face Spaces uses port 7860
    print(f"Starting Demucs API server on port {port}...")
    print("Make sure you have Demucs installed: pip install demucs")
    app.run(debug=False, host='0.0.0.0', port=port)