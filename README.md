# Video Call with AI Meeting Minutes

A one-to-one video calling web application with real-time speech-to-text transcription and AI-powered meeting minutes summarization.

## Features

- **Video Calling**: One-to-one video calls using Agora SDK v4.x
- **Speech-to-Text**: Real-time transcription using Web Speech API
- **Mute/Unmute Controls**: Audio and video mute/unmute functionality
- **AI Meeting Summary**: Automatic generation of meeting minutes with key points, action items, and next steps
- **Modern UI**: Clean, responsive interface using TailwindCSS

## Setup Instructions

### 1. Get Agora App ID

1. Sign up for an account at [Agora.io](https://www.agora.io/)
2. Create a new project in the Agora Console
3. Copy your App ID from the project dashboard
4. (Optional) Generate a token if required for your security settings

### 2. Configure the Application

1. Open `index.html` in a web browser
2. Enter your Agora App ID in the "Agora App ID" field
3. (Optional) Enter a token if required
4. Set a channel name and user ID
5. Click "Join Call" to start

### 3. Run Locally

1. Open `index.html` in a supported browser (Chrome/Edge recommended).
2. If needed, serve from local HTTP server (`python -m http.server`, `live-server`, or similar).
3. Enter
   - `Agora App ID`
   - `Channel Name`, `User ID`, optional token
4. Click `Join Call`.
5. In Live Transcription panel, click `Start` to use browser Web Speech API.

### 4. AI Service Integration

The application includes a mock AI service for demonstration. To integrate with a real AI service (like OpenAI, Claude, etc.), modify the `callAIService` function in `script.js`:

```javascript
async callAIService(transcript) {
    // Replace with your AI service API call
    const response = await fetch('YOUR_AI_API_ENDPOINT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
            transcript: transcript,
            task: 'summarize_meeting'
        })
    });

    const summary = await response.json();
    return summary;
}
```

## Browser Requirements

- Chrome/Edge (recommended - best Web Speech API support)
- Firefox (limited speech recognition support)
- Safari (limited speech recognition support)

## File Structure

```
summarizer/
├── index.html          # Main HTML file
├── styles.css          # Custom styles
├── script.js           # Main JavaScript application
└── README.md          # This file
```

## Usage Guide

### Starting a Video Call

1. Enter your Agora App ID
2. Set a channel name (both users must use the same channel)
3. Set your user ID
4. Click "Join Call"

### Using Transcription

1. Start the video call
2. Click "Start" in the Live Transcription panel
3. Allow microphone permissions when prompted
4. Speech will be transcribed in real-time

### Generating Meeting Summary

1. Conduct your meeting with transcription enabled
2. Click "Generate" in the AI Meeting Summary panel
3. Wait for the AI to process the transcript
4. Review the generated meeting minutes

### Controls

- **Mute Audio**: Toggle microphone on/off
- **Mute Video**: Toggle camera on/off
- **Leave Call**: End the video call and stop transcription

## Security Considerations

- Keep your Agora App ID and tokens secure
- Use HTTPS in production environments
- Consider implementing user authentication
- Token-based authentication is recommended for production

## Troubleshooting

### Common Issues

1. **Video not showing**: Check camera permissions and ensure HTTPS
2. **Audio not working**: Check microphone permissions
3. **Transcription not working**: Use Chrome/Edge for best compatibility
4. **Cannot join call**: Verify Agora App ID is correct and valid

### Error Messages

- "Please enter your Agora App ID": Enter a valid App ID from Agora Console
- "Failed to join call": Check App ID, network connection, and token (if required)
- "Speech recognition not supported": Use a supported browser (Chrome/Edge recommended)

## Development Notes

### Agora SDK Integration

The application uses Agora RTC SDK v4.x for video calling functionality. Key features implemented:

- Client initialization and channel joining
- Local audio/video track creation
- Remote user subscription
- Track publishing and unpublishing

### Speech Recognition

Uses the Web Speech API for real-time transcription:

- Continuous listening mode
- Interim and final results
- Automatic restart on errors
- Speaker identification

### AI Summary Generation

Currently uses a mock implementation that can be replaced with any AI service:

- Transcript processing
- Key point extraction
- Action item identification
- Next steps generation

## Future Enhancements

- Multiple participant support
- File export for transcripts and summaries
- Integration with calendar applications
- Real-time translation
- Screen sharing
- Recording functionality

## License

This project is for demonstration purposes. Please ensure compliance with Agora's terms of service and any AI service providers' terms of service when implementing in production.
