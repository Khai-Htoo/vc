import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, PictureInPicture } from 'lucide-react';
import './CallScreen.css';

export default function CallScreen({ localStream, remoteStream, onEndCall }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);

  // Set streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
         audioTracks[0].enabled = !audioTracks[0].enabled;
         setMicActive(audioTracks[0].enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
         videoTracks[0].enabled = !videoTracks[0].enabled;
         setCameraActive(videoTracks[0].enabled);
      }
    }
  };

  const togglePiP = async () => {
    try {
      if (remoteVideoRef.current !== document.pictureInPictureElement) {
        // Enter PiP
        await remoteVideoRef.current.requestPictureInPicture();
      } else {
        // Exit PiP
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle Picture-in-Picture:', error);
    }
  };

  return (
    <div className="call-screen fade-in-anim">
      {/* Remote Video (Full Screen) */}
      <div className="remote-view">
         {remoteStream ? (
           <video
             ref={remoteVideoRef}
             autoPlay
             playsInline
             className="remote-video"
           />
         ) : (
           <div className="connecting flex-center">
             <div className="spinner"></div>
             <p>Connecting...</p>
           </div>
         )}
      </div>

      {/* Local Video (PiP) */}
      <div className={`local-view ${!cameraActive ? 'video-off' : ''}`}>
        <video
           ref={localVideoRef}
           autoPlay
           playsInline
           muted
           className="local-video"
        />
        {!cameraActive && (
          <div className="avatar-fallback flex-center">
             You
          </div>
        )}
      </div>

      {/* Call Controls Overlay */}
      <div className="call-controls glass-panel slide-up-anim">
         <button className={`icon-btn glass ${!cameraActive ? 'off' : ''}`} onClick={toggleCamera}>
            {cameraActive ? <Video size={26} /> : <VideoOff size={26} color="#0f172a" />}
         </button>
         
         {/* PiP Button */}
         {remoteStream && (
           <button className="icon-btn glass" onClick={togglePiP} title="Picture-in-Picture">
              <PictureInPicture size={26} />
           </button>
         )}

         <button className={`icon-btn danger`} onClick={onEndCall}>
            <PhoneOff size={28} />
         </button>

         <button className={`icon-btn glass ${!micActive ? 'off' : ''}`} onClick={toggleMic}>
            {micActive ? <Mic size={26} /> : <MicOff size={26} color="#0f172a" />}
         </button>
      </div>
    </div>
  );
}
