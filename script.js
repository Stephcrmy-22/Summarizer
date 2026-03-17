// Video Call Application with AI Meeting Minutes

class VideoCallApp {
    constructor() {
        this.client = null;
        this.localTracks = {
            videoTrack: null,
            audioTrack: null
        };
        this.remoteUsers = {};
        this.isTranscribing = false;
        this.transcript = [];
        this.recognition = null;
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
    }

    initializeElements() {
        // Form elements
        this.channelInput = document.getElementById('channel');
        this.uidInput = document.getElementById('uid');
        this.appidInput = document.getElementById('appid');
        this.tokenInput = document.getElementById('token');
        this.joinButton = document.getElementById('join-call');
        this.connectionForm = document.getElementById('connection-form');

        // Video elements
        this.localVideoContainer = document.getElementById('local-video');
        this.remoteVideoContainer = document.getElementById('remote-video');

        // Control buttons
        this.muteAudioButton = document.getElementById('mute-audio');
        this.muteVideoButton = document.getElementById('mute-video');
        this.leaveButton = document.getElementById('leave-call');

        // Transcription elements
        this.transcriptionContainer = document.getElementById('transcription');
        this.startAgoraSttButton = document.getElementById('start-agora-stt');
        this.agoraSttAppIdInput = document.getElementById('agora-stt-appid');
        this.agoraSttProjectIdInput = document.getElementById('agora-stt-projectid');
        this.agoraSttTokenInput = document.getElementById('agora-stt-token');

        // Summary elements
        this.summaryContainer = document.getElementById('summary');
        this.generateSummaryButton = document.getElementById('generate-summary');
        this.geminiApiInput = document.getElementById('gemini-api-key');
    }

    setupEventListeners() {
        this.joinButton.addEventListener('click', () => this.joinCall());
        this.leaveButton.addEventListener('click', () => this.leaveCall());
        this.muteAudioButton.addEventListener('click', () => this.toggleAudio());
        this.muteVideoButton.addEventListener('click', () => this.toggleVideo());
        this.startAgoraSttButton.addEventListener('click', () => this.startAgoraSTT());
        this.generateSummaryButton.addEventListener('click', () => this.generateSummary());
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    this.addTranscript(finalTranscript, 'You');
                }

                // Update interim transcript display
                const currentContent = this.transcriptionContainer.innerHTML;
                if (interimTranscript && !currentContent.includes('...')) {
                    this.transcriptionContainer.innerHTML += `<div class="text-gray-400 italic">${interimTranscript}...</div>`;
                } else if (!interimTranscript && currentContent.includes('...')) {
                    this.transcriptionContainer.innerHTML = currentContent.replace(/<div class="text-gray-400 italic">.*?<\/div>/, '');
                }
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    this.recognition.stop();
                    setTimeout(() => {
                        if (this.isTranscribing) {
                            this.recognition.start();
                        }
                    }, 1000);
                }
            };

            this.recognition.onend = () => {
                if (this.isTranscribing) {
                    setTimeout(() => {
                        this.recognition.start();
                    }, 1000);
                }
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
        }
    }

    async joinCall() {
        const appId = this.appidInput.value.trim();
        const channel = this.channelInput.value.trim();
        const uid = this.uidInput.value.trim();
        const token = this.tokenInput.value.trim();

        if (!appId) {
            alert('Please enter your Agora App ID');
            return;
        }

        try {
            // Create Agora client
            this.client = AgoraRTC.createClient({
                mode: 'rtc',
                codec: 'vp8'
            });

            // Set up event listeners
            this.setupAgoraEventListeners();

            // Join channel
            await this.client.join(appId, channel, token || null, uid || null);

            // Create local tracks
            this.localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            this.localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();

            // Play local video
            this.localTracks.videoTrack.play(this.localVideoContainer);

            // Publish local tracks
            await this.client.publish([this.localTracks.audioTrack, this.localTracks.videoTrack]);

            // If Agora STT is started, attach local audio track
            if (this.agoraSTT && this.localTracks.audioTrack) {
                this.attachTrackToSTT(this.localTracks.audioTrack, 'local');
            }

            // Update UI
            this.connectionForm.style.display = 'none';
            this.addConnectionStatus('connected');

        } catch (error) {
            console.error('Failed to join call:', error);
            alert('Failed to join call: ' + error.message);
        }
    }

    setupAgoraEventListeners() {
        this.client.on('user-published', async (user, mediaType) => {
            await this.client.subscribe(user, mediaType);
            
            if (mediaType === 'video') {
                const remoteVideoTrack = user.videoTrack;
                remoteVideoTrack.play(this.remoteVideoContainer);
            }
            
            if (mediaType === 'audio') {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
                if (this.agoraSTT) {
                    this.attachTrackToSTT(remoteAudioTrack, user.uid);
                }
            }

            this.remoteUsers[user.uid] = user;
        });

        this.client.on('user-unpublished', (user) => {
            delete this.remoteUsers[user.uid];
        });

        this.client.on('user-left', (user) => {
            if (this.agoraSTT) {
                this.agoraSTT.removeParticipant(user.uid);
            }
            delete this.remoteUsers[user.uid];
            this.remoteVideoContainer.innerHTML = '<span class="text-gray-400">Remote Video</span>';
        });
    }

    async startAgoraSTT() {
        const sttAppId = this.agoraSttAppIdInput.value.trim();
        const sttProjectId = this.agoraSttProjectIdInput.value.trim();
        const sttToken = this.agoraSttTokenInput.value.trim();

        if (!sttAppId || !sttProjectId || !sttToken) {
            alert('Please provide Agora STT App ID, Project ID, and Token');
            return;
        }

        if (!window.AgoraSTT) {
            alert('Agora STT module not loaded. Make sure agora-stt.js is included');
            return;
        }

        this.agoraSTT = new AgoraSTT({
            appId: sttAppId,
            projectId: sttProjectId,
            token: sttToken,
            transcriptionCallback: (text, userId) => {
                this.addTranscript(`${userId}: ${text}`, 'Remote');
            }
        });

        try {
            await this.agoraSTT.init();
            this.addTranscript('Agora STT initialized and listening', 'System');

            // attach local track if already available
            if (this.localTracks.audioTrack) {
                this.attachTrackToSTT(this.localTracks.audioTrack, 'local');
            }

            Object.values(this.remoteUsers).forEach(user => {
                if (user.audioTrack) {
                    this.attachTrackToSTT(user.audioTrack, user.uid);
                }
            });
        } catch (error) {
            console.error('Agora STT init failed:', error);
            alert('Failed to initialize Agora STT: '+error.message);
        }
    }

    attachTrackToSTT(agoraAudioTrack, participantId) {
        try {
            const mediaTrack = agoraAudioTrack.getMediaStreamTrack ? agoraAudioTrack.getMediaStreamTrack() : null;
            if (!mediaTrack) {
                console.warn('Cannot get media track from Agora audio track');
                return;
            }
            const mediaStream = new MediaStream([mediaTrack]);
            this.agoraSTT.addStream(mediaStream, participantId);
        } catch (err) {
            console.error('Error attaching track to STT:', err);
        }
    }

    async leaveCall() {
        try {
            if (this.localTracks.audioTrack) {
                this.localTracks.audioTrack.close();
            }
            if (this.localTracks.videoTrack) {
                this.localTracks.videoTrack.close();
            }

            if (this.client) {
                await this.client.leave();
            }

            // Reset UI
            this.localVideoContainer.innerHTML = '<span class="text-gray-400">Local Video</span>';
            this.remoteVideoContainer.innerHTML = '<span class="text-gray-400">Remote Video</span>';
            this.connectionForm.style.display = 'block';
            this.addConnectionStatus('disconnected');

            // Stop transcription
            if (this.isTranscribing) {
                this.toggleTranscription();
            }

        } catch (error) {
            console.error('Error leaving call:', error);
        }
    }

    toggleAudio() {
        if (this.localTracks.audioTrack) {
            if (this.isAudioMuted) {
                this.localTracks.audioTrack.setMuted(false);
                this.muteAudioButton.classList.remove('muted');
                this.muteAudioButton.querySelector('span').textContent = 'Mute Audio';
            } else {
                this.localTracks.audioTrack.setMuted(true);
                this.muteAudioButton.classList.add('muted');
                this.muteAudioButton.querySelector('span').textContent = 'Unmute Audio';
            }
            this.isAudioMuted = !this.isAudioMuted;
        }
    }

    toggleVideo() {
        if (this.localTracks.videoTrack) {
            if (this.isVideoMuted) {
                this.localTracks.videoTrack.setMuted(false);
                this.muteVideoButton.classList.remove('muted');
                this.muteVideoButton.querySelector('span').textContent = 'Mute Video';
            } else {
                this.localTracks.videoTrack.setMuted(true);
                this.muteVideoButton.classList.add('muted');
                this.muteVideoButton.querySelector('span').textContent = 'Unmute Video';
            }
            this.isVideoMuted = !this.isVideoMuted;
        }
    }

    toggleTranscription() {
        if (!this.recognition) return;

        if (this.isTranscribing) {
            this.recognition.stop();
            this.isTranscribing = false;
            this.toggleTranscriptionButton.textContent = 'Start';
            this.toggleTranscriptionButton.classList.remove('bg-red-600');
            this.toggleTranscriptionButton.classList.add('bg-blue-600');
        } else {
            this.recognition.start();
            this.isTranscribing = true;
            this.toggleTranscriptionButton.textContent = 'Stop';
            this.toggleTranscriptionButton.classList.remove('bg-blue-600');
            this.toggleTranscriptionButton.classList.add('bg-red-600');
        }
    }

    addTranscript(text, speaker) {
        const timestamp = new Date().toLocaleTimeString();
        const transcriptEntry = {
            text,
            speaker,
            timestamp
        };
        
        this.transcript.push(transcriptEntry);
        
        const transcriptElement = document.createElement('div');
        transcriptElement.className = 'mb-2';
        transcriptElement.innerHTML = `
            <div class="text-xs text-gray-500">${timestamp}</div>
            <div><span class="transcription-speaker">${speaker}:</span> ${text}</div>
        `;
        
        // Remove placeholder if exists
        const placeholder = this.transcriptionContainer.querySelector('.text-gray-400');
        if (placeholder) {
            placeholder.remove();
        }
        
        this.transcriptionContainer.appendChild(transcriptElement);
        this.transcriptionContainer.scrollTop = this.transcriptionContainer.scrollHeight;
    }

    async generateSummary() {
        if (this.transcript.length === 0) {
            alert('No transcript available to summarize');
            return;
        }

        this.generateSummaryButton.disabled = true;
        this.generateSummaryButton.innerHTML = '<span class="loading-spinner"></span>Generating...';

        try {
            const fullTranscript = this.transcript.map(entry => 
                `${entry.timestamp} - ${entry.speaker}: ${entry.text}`
            ).join('\n');

            // If user entered a Gemini key, use it for this request
            const geminiKey = this.geminiApiInput?.value.trim();
            if (geminiKey) {
                if (!window.AI_CONFIG) window.AI_CONFIG = {};
                if (!window.AI_CONFIG.gemini) window.AI_CONFIG.gemini = {};
                window.AI_CONFIG.gemini.apiKey = geminiKey;
                window.AI_CONFIG.currentService = 'gemini';
            }

            // Simulate AI API call (replace with actual AI service)
            const summary = await this.callAIService(fullTranscript);
            
            this.displaySummary(summary);
            
        } catch (error) {
            console.error('Error generating summary:', error);
            this.summaryContainer.innerHTML = '<div class="text-red-400">Failed to generate summary. Please try again.</div>';
        } finally {
            this.generateSummaryButton.disabled = false;
            this.generateSummaryButton.innerHTML = 'Generate';
        }
    }

    async callAIService(transcript) {
        const service = window.AI_CONFIG?.currentService || 'mock';
        
        if (service === 'mock') {
            // Mock implementation for demonstration
            return await this.mockAIService(transcript);
        }

        try {
            let response;
            const prompt = window.AI_PROMPTS?.meetingSummary || AI_PROMPTS.meetingSummary;
            
            switch (service) {
                case 'openai':
                    response = await this.callOpenAI(transcript, prompt);
                    break;
                case 'anthropic':
                    response = await this.callAnthropic(transcript, prompt);
                    break;
                case 'gemini':
                    response = await this.callGemini(transcript, prompt);
                    break;
                case 'custom':
                    response = await this.callCustomAI(transcript, prompt);
                    break;
                default:
                    throw new Error('Unsupported AI service');
            }
            
            return response;
        } catch (error) {
            console.error('AI service error:', error);
            // Fallback to mock service
            return await this.mockAIService(transcript);
        }
    }

    async callOpenAI(transcript, prompt) {
        const config = window.AI_CONFIG.openai;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: prompt },
                    { role: 'user', content: transcript }
                ],
                max_tokens: config.maxTokens,
                temperature: config.temperature
            })
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }

    async callAnthropic(transcript, prompt) {
        const config = window.AI_CONFIG.anthropic;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                max_tokens: config.maxTokens,
                messages: [
                    { role: 'user', content: `${prompt}\n\nTranscript:\n${transcript}` }
                ]
            })
        });

        const data = await response.json();
        return JSON.parse(data.content[0].text);
    }

    async callGemini(transcript, prompt) {
        const config = window.AI_CONFIG.gemini;
        const response = await fetch(`${config.endpoint}?key=${config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${prompt}\n\nTranscript:\n${transcript}`
                    }]
                }]
            })
        });

        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
    }

    async callCustomAI(transcript, prompt) {
        const config = window.AI_CONFIG.custom;
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: config.headers,
            body: JSON.stringify({
                prompt: `${prompt}\n\nTranscript:\n${transcript}`,
                task: 'summarize_meeting'
            })
        });

        return await response.json();
    }

    async mockAIService(transcript) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simple mock summary generation (replace with actual AI service)
        const summary = {
            meetingDuration: this.transcript.length > 0 ? 
                `${Math.ceil(this.transcript.length / 10)} minutes` : 'Unknown',
            participants: ['You', 'Remote User'],
            keyPoints: this.extractKeyPoints(transcript),
            actionItems: this.extractActionItems(transcript),
            nextSteps: this.extractNextSteps(transcript)
        };
        
        return summary;
    }

    extractKeyPoints(transcript) {
        // Simple keyword extraction (replace with actual AI processing)
        const keyPoints = [];
        const text = transcript.toLowerCase();
        
        if (text.includes('project')) keyPoints.push('Discussion about project progress');
        if (text.includes('deadline')) keyPoints.push('Timeline and deadline considerations');
        if (text.includes('budget')) keyPoints.push('Budget and resource allocation');
        if (text.includes('issue') || text.includes('problem')) keyPoints.push('Issue identification and resolution');
        
        return keyPoints.length > 0 ? keyPoints : ['General discussion and updates'];
    }

    extractActionItems(transcript) {
        // Simple action item detection (replace with actual AI processing)
        const actionItems = [];
        const text = transcript.toLowerCase();
        
        if (text.includes('will') || text.includes('need to') || text.includes('should')) {
            actionItems.push('Follow up on discussed items');
        }
        
        return actionItems.length > 0 ? actionItems : ['Review meeting notes and follow up'];
    }

    extractNextSteps(transcript) {
        // Simple next steps extraction (replace with actual AI processing)
        return [
            'Schedule follow-up meeting if needed',
            'Share meeting notes with participants',
            'Work on identified action items'
        ];
    }

    displaySummary(summary) {
        this.summaryContainer.innerHTML = `
            <div class="space-y-4">
                <div class="summary-section">
                    <h4 class="font-semibold text-purple-400 mb-2">Meeting Overview</h4>
                    <p class="text-sm">Duration: ${summary.meetingDuration}</p>
                    <p class="text-sm">Participants: ${summary.participants.join(', ')}</p>
                </div>
                
                <div class="summary-section">
                    <h4 class="font-semibold text-purple-400 mb-2">Key Discussion Points</h4>
                    ${summary.keyPoints.map(point => `<div class="summary-point">${point}</div>`).join('')}
                </div>
                
                <div class="summary-section">
                    <h4 class="font-semibold text-purple-400 mb-2">Action Items</h4>
                    ${summary.actionItems.map(item => `<div class="summary-point">${item}</div>`).join('')}
                </div>
                
                <div class="summary-section">
                    <h4 class="font-semibold text-purple-400 mb-2">Next Steps</h4>
                    ${summary.nextSteps.map(step => `<div class="summary-point">${step}</div>`).join('')}
                </div>
            </div>
        `;
    }

    addConnectionStatus(status) {
        // Remove existing status
        const existingStatus = document.querySelector('.connection-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Add new status
        const statusElement = document.createElement('div');
        statusElement.className = `connection-status ${status}`;
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        this.localVideoContainer.appendChild(statusElement);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoCallApp();
});
