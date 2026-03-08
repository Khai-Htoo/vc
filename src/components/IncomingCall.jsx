import React, { useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import './IncomingCall.css';

export default function IncomingCall({ callerId, onAccept, onReject }) {
  useEffect(() => {
    // Attempt HTML5 Notification
    if (Notification.permission === 'granted') {
      const notification = new Notification('Incoming Video Call', {
        body: `${callerId} is calling...`,
        icon: '/vite.svg', // Basic icon
        requireInteraction: true,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Play ringtone
    try {
       const AudioContext = window.AudioContext || window.webkitAudioContext;
       if (AudioContext) {
         const ctx = new AudioContext();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         
         osc.type = 'sine';
         osc.frequency.setValueAtTime(440, ctx.currentTime);
         osc.frequency.setValueAtTime(480, ctx.currentTime + 0.5);
         
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.start();
         
         const inter = setInterval(() => {
             if (ctx.state === 'running') {
                const o = ctx.createOscillator();
                o.type = 'square';
                o.frequency.value = 600;
                o.connect(ctx.destination);
                o.start();
                o.stop(ctx.currentTime + 0.1);
             }
         }, 1000);

         return () => {
           clearInterval(inter);
           osc.stop();
           if (ctx.state !== 'closed') ctx.close();
         };
       }
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  }, [callerId]);

  return (
    <div className="incoming-overlay">
      <div className="incoming-content">
        <div className="caller-info translate-y-anim">
          <h2>Incoming Call</h2>
          <div className="caller-avatar flex-center">
            {callerId?.substring(0, 2).toUpperCase() || 'ID'}
          </div>
          <p className="caller-id">{callerId}</p>
          <p className="calling-text">P2P Audio/Video...</p>
        </div>

        <div className="action-buttons slide-up-anim">
          <button className="action-btn decline" onClick={onReject}>
            <PhoneOff size={32} />
          </button>
          <button className="action-btn accept animate-pulse" onClick={onAccept}>
            <Phone size={32} />
          </button>
        </div>
      </div>
    </div>
  );
}
