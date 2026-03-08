import React, { useEffect, useState, useRef } from 'react';
import Peer from 'peerjs';
import { Phone, Copy, CheckCircle2, Video, Check, Download } from 'lucide-react';
import './App.css';
import IncomingCall from './components/IncomingCall';
import CallScreen from './components/CallScreen';

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [peer, setPeer] = useState(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Call states
  const [incomingCall, setIncomingCall] = useState(null); // The PeerJS call object
  const [activeCall, setActiveCall] = useState(null);
  
  // Media streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Initialize PeerJS
  useEffect(() => {
    // Request Notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    const newPeer = new Peer(); // Auto-generates an ID
    
    newPeer.on('open', (id) => {
      setPeerId(id);
    });

    newPeer.on('call', (call) => {
      // Receive incoming call
      setIncomingCall(call);

      // Trigger a system notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Incoming Call', {
          body: `Incoming call from ${call.peer}`,
          icon: '/pwa-icon.svg',
          requireInteraction: true // Keeps the notification on screen until interacted with
        });
      }
    });

    newPeer.on('error', (err) => {
      console.error(err);
      setErrorMsg(err.message || 'Connection failed.');
      setTimeout(() => setErrorMsg(''), 5000);
    });

    setPeer(newPeer);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      newPeer.destroy();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Request media permissions and stream
  const getMediaStream = async () => {
    if (localStream) return localStream;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Failed to get video+audio stream, trying audio only', err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        setLocalStream(audioStream);
        return audioStream;
      } catch (audioErr) {
        setErrorMsg('Failed to access camera/microphone');
        console.error('Failed to get local stream', audioErr);
        return null;
      }
    }
  };

  const handleCall = async () => {
    if (!remotePeerIdValue.trim()) return;
    if (!peer) return;

    const stream = await getMediaStream();
    if (!stream) return;

    const call = peer.call(remotePeerIdValue, stream);
    setActiveCall(call);

    call.on('stream', (userVideoStream) => {
      setRemoteStream(userVideoStream);
    });

    call.on('close', () => {
      endCall();
    });
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    const stream = await getMediaStream();
    if (!stream) return;

    incomingCall.answer(stream);
    setActiveCall(incomingCall);
    setIncomingCall(null);

    incomingCall.on('stream', (userVideoStream) => {
      setRemoteStream(userVideoStream);
    });

    incomingCall.on('close', () => {
      endCall();
    });
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (activeCall) {
      activeCall.close();
    }
    setActiveCall(null);
    setRemoteStream(null);
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Optionally log the outcome
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // If in an active call, show the call screen (but allow incoming call to show over it)
  if (activeCall && !incomingCall) {
    return (
      <CallScreen 
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={endCall}
      />
    );
  }

  // If active call exists AND incoming call exists, we render a combined view
  if (activeCall && incomingCall) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <CallScreen 
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
        />
        <IncomingCall 
           callerId={incomingCall.peer}
           onAccept={() => {
             // End current call before answering new one
             endCall();
             setTimeout(answerCall, 500);
           }}
           onReject={rejectCall}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Title */}
      <div className="header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <h1 style={{ margin: 0 }}>Khai Htoo Lay VC</h1>
        {isInstallable && (
          <button 
            onClick={handleInstallClick}
            style={{ position: 'absolute', right: 0, padding: '0.4rem 0.8rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            title="Install App"
          >
            <Download size={14} /> Install
          </button>
        )}
      </div>

      {/* Peer Info */}
      <div className="peer-info glass-panel">
        <h3>Your Peer ID</h3>
        <div className="peer-id-display" onClick={copyId} title="Click to Copy">
          {peerId ? peerId : 'Connecting...'}
        </div>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {copied ? <><CheckCircle2 size={16} color="var(--accent-success)"/> Copied to clipboard</> : 'Tap ID to copy and share'}
        </p>
      </div>

      {/* Permissions Area */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        {!localStream ? (
          <>
            <p className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', margin: 0 }}>Authorize camera and microphone before calling</p>
            <button 
              style={{ padding: '0.8rem 1.5rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', backgroundColor: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
              onClick={getMediaStream}
            >
              <Video size={20} /> Grant Access
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: '500' }}>
            <Check size={20} /> Media Access Granted
          </div>
        )}
      </div>

      {/* Main Dialing Area */}
      <div className="dial-pad glass-panel">
        <div className="input-group">
          <input 
            type="text" 
            placeholder="Enter friend's Peer ID" 
            value={remotePeerIdValue}
            onChange={(e) => setRemotePeerIdValue(e.target.value)}
          />
        </div>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <div className="call-btn-container">
          <button 
            className="icon-btn success btn-large" 
            onClick={handleCall}
            disabled={!peerId || !remotePeerIdValue}
          >
            <Phone />
          </button>
        </div>
      </div>

      {/* Incoming Call Overlay */}
      {incomingCall && (
        <IncomingCall 
           callerId={incomingCall.peer}
           onAccept={answerCall}
           onReject={rejectCall}
        />
      )}
    </div>
  );
}

export default App;
