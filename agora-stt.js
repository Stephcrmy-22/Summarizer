class AgoraSTT {
    constructor({appId, projectId, token, transcriptionCallback}) {
        this.appId = appId;
        this.projectId = projectId;
        this.token = token;
        this.transcriptionCallback = transcriptionCallback || (() => {});
        this.socket = null;
        this.sessionId = null;
        this.streams = new Map();
    }

    async init() {
        const joinUrl = `https://api.agora.io/api/speech-to-text/v1/projects/${encodeURIComponent(this.projectId)}/apps/${encodeURIComponent(this.appId)}/join`;

        const response = await fetch(joinUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`: ${this.token}`)}`
            },
            body: JSON.stringify({
                mode: 'real-time',
                uid: String(Math.floor(Math.random()*1000000)),
                role: 'speaker'
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Agora STT join failed: ${response.status} ${text}`);
        }

        const data = await response.json();
        this.sessionId = data.sessionId || data.sid || null;
        const websocketUrl = data.wsUrl || `wss://api.agora.io/api/speech-to-text/v1/projects/${encodeURIComponent(this.projectId)}/apps/${encodeURIComponent(this.appId)}/stt?token=${encodeURIComponent(this.token)}`;

        if (!websocketUrl) {
            throw new Error('Could not determine Agora STT websocket URL');
        }

        this.socket = new WebSocket(websocketUrl);

        this.socket.onopen = () => {
            console.log('Agora STT websocket opened');
            this.send({type: 'join', sessionId: this.sessionId});
        };

        this.socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'transcription' || msg.type === 'message') {
                    const text = msg.text || msg.result || '';
                    const userId = msg.uid || 'remote';
                    if (text) {
                        this.transcriptionCallback(text, userId);
                    }
                }
            } catch (err) {
                console.warn('Error parsing STT message', err);
            }
        };

        this.socket.onerror = (error) => {
            console.error('Agora STT websocket error', error);
        };

        this.socket.onclose = () => {
            console.log('Agora STT websocket closed');
        };
    }

    send(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Agora STT socket not open');
            return;
        }
        this.socket.send(JSON.stringify(message));
    }

    addStream(mediaStream, streamId) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Agora STT socket not ready for stream');
            return;
        }

        if (this.streams.has(streamId)) {
            return;
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(mediaStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = event => {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            const downsampled = this.downsampleBuffer(inputBuffer, audioContext.sampleRate, 16000);
            if (downsampled) {
                const pcm = this.floatTo16BitPCM(downsampled);
                const base64 = btoa(String.fromCharCode.apply(null, pcm));
                this.send({type: 'input_audio', sessionId: this.sessionId, data: base64, uid: streamId});
            }
        };

        this.streams.set(streamId, {audioContext, source, processor});
    }

    removeParticipant(streamId) {
        const info = this.streams.get(streamId);
        if (info) {
            info.processor.disconnect();
            info.source.disconnect();
            info.audioContext.close();
            this.streams.delete(streamId);
        }
    }

    floatTo16BitPCM(input) {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return output;
    }

    downsampleBuffer(buffer, sampleRate, outSampleRate) {
        if (outSampleRate === sampleRate) {
            return buffer;
        }
        if (outSampleRate > sampleRate) {
            throw new Error('Downsampling rate should be smaller than original sample rate');
        }
        const sampleRateRatio = sampleRate / outSampleRate;
        const newLength = Math.round(buffer.length / sampleRateRatio);
        const result = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;
        while (offsetResult < result.length) {
            const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            let accum = 0, count = 0;
            for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }
}

window.AgoraSTT = AgoraSTT;
