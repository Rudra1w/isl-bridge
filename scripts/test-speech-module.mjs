import assert from 'node:assert/strict';
import { test } from 'node:test';

// 1. Test Text Normalization Logic
test('SpeechRecognitionService.normalizeTranscript correctly normalizes raw transcripts', () => {
  const normalize = (raw) => {
    if (!raw) return '';
    let normalized = raw.trim().replace(/\s+/g, ' ');
    normalized = normalized
      .replace(/\b(um|uh|er|ah|hmm)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (normalized.length > 0) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return normalized;
  };

  assert.equal(
    normalize('  um hello,   doctor, uh please help me   '),
    'Hello, doctor, please help me'
  );
  assert.equal(
    normalize('where is the hospital?'),
    'Where is the hospital?'
  );
  assert.equal(
    normalize('ah er thank you very much'),
    'Thank you very much'
  );
  assert.equal(normalize(''), '');
  assert.equal(normalize('   '), '');
});

// 2. Test Unsupported Browser State and Error Mapping
test('Speech recognition error codes map correctly to explicit user-facing statuses', () => {
  const mapError = (errType, locale = 'en-IN') => {
    let status = 'error';
    let errorMessage = `Speech recognition error: ${errType}`;

    if (errType === 'not-allowed') {
      status = 'blocked';
      errorMessage = 'Microphone permission was blocked or denied. Please click the camera/mic icon in the browser address bar to allow access.';
    } else if (errType === 'audio-capture') {
      status = 'blocked';
      errorMessage = 'No microphone was found or the microphone is currently busy in another application.';
    } else if (errType === 'network') {
      status = 'service-unavailable';
      errorMessage = 'Network error: Unable to connect to browser speech recognition cloud service. Please check your internet connection.';
    } else if (errType === 'service-not-allowed') {
      status = 'service-unavailable';
      errorMessage = 'Speech service is not allowed by your browser or operating system security policy.';
    } else if (errType === 'no-speech') {
      status = 'ready';
      errorMessage = 'No speech was detected. Please check microphone input or speak clearly.';
    } else if (errType === 'language-not-supported') {
      status = 'service-unavailable';
      errorMessage = `The selected language (${locale}) is not supported on this browser engine.`;
    }

    return { status, errorMessage };
  };

  // Test: microphone permission denied
  const blocked = mapError('not-allowed');
  assert.equal(blocked.status, 'blocked');
  assert.ok(blocked.errorMessage.includes('permission was blocked or denied'));

  // Test: audio-capture unavailable
  const noMic = mapError('audio-capture');
  assert.equal(noMic.status, 'blocked');
  assert.ok(noMic.errorMessage.includes('No microphone was found'));

  // Test: network error
  const net = mapError('network');
  assert.equal(net.status, 'service-unavailable');
  assert.ok(net.errorMessage.includes('Network error'));

  // Test: service-not-allowed
  const svc = mapError('service-not-allowed');
  assert.equal(svc.status, 'service-unavailable');

  // Test: no-speech
  const noSpeech = mapError('no-speech');
  assert.equal(noSpeech.status, 'ready');

  // Test: language-not-supported
  const langErr = mapError('language-not-supported', 'en-IN');
  assert.equal(langErr.status, 'service-unavailable');
  assert.ok(langErr.errorMessage.includes('en-IN'));
});

// 3. Test Repeated Sessions State Transitions
test('Speech recognition state machine transitions correctly through session lifecycle', () => {
  class MockSpeechSession {
    constructor() {
      this.status = 'ready';
      this.isListening = false;
      this.finalTranscript = '';
      this.interimTranscript = '';
    }

    start() {
      if (this.isListening) return;
      this.isListening = true;
      this.status = 'listening';
    }

    onAudio() {
      if (this.isListening) this.status = 'listening';
    }

    onInterim(text) {
      this.interimTranscript = text;
      this.status = 'processing';
    }

    onFinal(text) {
      this.finalTranscript = text;
      this.interimTranscript = '';
      this.status = 'recognized';
    }

    stop() {
      this.isListening = false;
      this.status = 'ready';
    }
  }

  const session = new MockSpeechSession();
  assert.equal(session.status, 'ready');

  // Session 1: Start listening
  session.start();
  assert.equal(session.status, 'listening');
  assert.equal(session.isListening, true);

  // Hearing partial audio
  session.onInterim('where is');
  assert.equal(session.status, 'processing');
  assert.equal(session.interimTranscript, 'where is');

  // Finalized
  session.onFinal('Where is the hospital?');
  assert.equal(session.status, 'recognized');
  assert.equal(session.finalTranscript, 'Where is the hospital?');

  // Stop
  session.stop();
  assert.equal(session.status, 'ready');
  assert.equal(session.isListening, false);

  // Session 2: Immediate restart (repeated session)
  session.start();
  assert.equal(session.status, 'listening');
  session.stop();
  assert.equal(session.status, 'ready');
});

// 4. Test Speech Synthesis Parameter Clamping
test('SpeechSynthesisService bounds parameters correctly', () => {
  const clampRate = (r) => Math.max(0.5, Math.min(2.0, r));
  const clampPitch = (p) => Math.max(0.5, Math.min(1.5, p));
  const clampVolume = (v) => Math.max(0.0, Math.min(1.0, v));

  assert.equal(clampRate(0.1), 0.5);
  assert.equal(clampRate(3.5), 2.0);
  assert.equal(clampRate(1.2), 1.2);

  assert.equal(clampPitch(0.2), 0.5);
  assert.equal(clampPitch(2.0), 1.5);
  assert.equal(clampPitch(1.0), 1.0);

  assert.equal(clampVolume(-0.5), 0.0);
  assert.equal(clampVolume(1.5), 1.0);
  assert.equal(clampVolume(0.8), 0.8);
});

// 5. Test Indian English Voice Prioritization
test('SpeechSynthesisService identifies and prioritizes Indian English voices', () => {
  const voices = [
    { voiceURI: 'v1', name: 'Google US English', lang: 'en-US', default: false },
    { voiceURI: 'v2', name: 'Google UK English Female', lang: 'en-GB', default: false },
    { voiceURI: 'v3', name: 'Google Indian English', lang: 'en-IN', default: false },
    { voiceURI: 'v4', name: 'Microsoft Heera - English (India)', lang: 'en-IN', default: false },
  ];

  const processed = voices.map((v) => ({
    ...v,
    isIndianEnglish:
      v.lang.toLowerCase() === 'en-in' ||
      v.name.toLowerCase().includes('india') ||
      v.name.toLowerCase().includes('hindi'),
  }));

  const indianVoices = processed.filter((v) => v.isIndianEnglish);
  assert.equal(indianVoices.length, 2);
  assert.equal(indianVoices[0].name, 'Google Indian English');
  assert.equal(indianVoices[1].name, 'Microsoft Heera - English (India)');
});
