import React, { useCallback, useState } from 'react';
import {
  useDaily,
  useScreenShare,
  useLocalParticipant,
  useVideoTrack,
  useAudioTrack,
  useDailyEvent,
  useInputSettings,
  useRecording,
  useParticipant,
  useLocalSessionId,
} from '@daily-co/daily-react';

import MeetingInformation from '../MeetingInformation/MeetingInformation';
import Chat from '../Chat/Chat';

import './Tray.css';
import {
  CameraOn,
  Leave,
  CameraOff,
  MicrophoneOff,
  MicrophoneOn,
  Screenshare,
  Info,
  ChatIcon,
  ChatHighlighted,
} from './Icons';

export default function Tray({ leaveCall }) {
  const callObject = useDaily();
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  const [showMeetingInformation, setShowMeetingInformation] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState(false);

  const localParticipant = useLocalParticipant();
  const localVideo = useVideoTrack(localParticipant?.session_id);
  const localAudio = useAudioTrack(localParticipant?.session_id);
  const mutedVideo = localVideo.isOff;
  const mutedAudio = localAudio.isOff;

  const {inputSettings, updateInputSettings} = useInputSettings();
  const { audio: audioSettings, video: videoSettings } = inputSettings || {};
  const audioProcessorType = audioSettings?.processor.type;
  const videoProcessorType = videoSettings?.processor.type;

  const selfSessionId = useLocalSessionId();
  const { isRecording, startRecording, stopRecording, startedBy } = useRecording();
  const participantData = useParticipant(startedBy);
  const isSelfRecording = isRecording && selfSessionId === startedBy;
  const recorderName = isRecording ? `${participantData?.user_name}` : null;

  /* When a remote participant sends a message in the chat, we want to display a differently colored
   * chat icon in the Tray as a notification. By listening for the `"app-message"` event we'll know
   * when someone has sent a message. */
  useDailyEvent(
    'app-message',
    useCallback(() => {
      /* Only light up the chat icon if the chat isn't already open. */
      if (!showChat) {
        setNewChatMessage(true);
      }
    }, [showChat]),
  );

  const toggleVideo = useCallback(() => {
    callObject.setLocalVideo(mutedVideo);
  }, [callObject, mutedVideo]);

  const toggleAudio = useCallback(() => {
    callObject.setLocalAudio(mutedAudio);
  }, [callObject, mutedAudio]);

  const toggleAudioProcessing = useCallback(() => {
    const isEnabled = audioProcessorType && audioProcessorType !== 'none';
    updateInputSettings({ audio: { processor: { type: isEnabled ? 'none' : 'noise-cancellation' }}})
  }, [updateInputSettings, audioProcessorType])

  const toggleVideoProcessing = useCallback(() => {
    const isEnabled = videoProcessorType && videoProcessorType !== 'none';
    updateInputSettings({ video: { processor: {
      type: isEnabled ? 'none' : 'background-blur',
      config: { strength: 0.3 }
    }}})
  }, [updateInputSettings, videoProcessorType])

  const toggleScreenShare = () => (isSharingScreen ? stopScreenShare() : startScreenShare());

  const toggleMeetingInformation = () => {
    setShowMeetingInformation(!showMeetingInformation);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    if (newChatMessage) {
      setNewChatMessage(!newChatMessage);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <div className="tray">
      {showMeetingInformation && <MeetingInformation />}
      {/*  The chat messages 'live' in the <Chat/> component's state. We can't just remove the component */}
      {/*  from the DOM when hiding the chat, because that would cause us to lose that state. So we're */}
      {/*  choosing a slightly different approach of toggling the chat: always render the component, but only */}
      {/*  render its HTML when showChat is set to true. */}

      {/*   We're also passing down the toggleChat() function to the component, so we can open and close the chat */}
      {/*   from the chat UI and not just the Tray. */}
      <Chat showChat={showChat} toggleChat={toggleChat} />
      <div className="tray-buttons-container">
        <div className="controls">
          <button onClick={toggleVideo} type="button">
            {mutedVideo ? <CameraOff /> : <CameraOn />}
            {mutedVideo ? 'Turn camera on' : 'Turn camera off'}
          </button>
          <button onClick={toggleAudio} type="button">
            {mutedAudio ? <MicrophoneOff /> : <MicrophoneOn />}
            {mutedAudio ? 'Unmute mic' : 'Mute mic'}
          </button>
          <button onClick={toggleAudioProcessing} type="button">
            {audioProcessorType === 'noise-cancellation' ? 'Disable noise cancellation' : 'Enable noise cancellation'}
          </button>
          <button onClick={toggleVideoProcessing} type="button">
            {videoProcessorType === 'background-blur' ? 'Disable background blur' : 'Enable background blur'}
          </button>
        </div>
        <div className="actions">
          <button onClick={toggleScreenShare} type="button">
            <Screenshare />
            {isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
          </button>
          <button onClick={toggleMeetingInformation} type="button">
            <Info />
            {showMeetingInformation ? 'Hide info' : 'Show info'}
          </button>
          <button onClick={toggleChat} type="button">
            {newChatMessage ? <ChatHighlighted /> : <ChatIcon />}
            {showChat ? 'Hide chat' : 'Show chat'}
          </button>
          <button onClick={toggleRecording} disabled={isRecording && !isSelfRecording} type="button">
            {isRecording
              ? isSelfRecording
                ? `Stop recording`
                : `${recorderName} started a recording`
              : 'Record meeting'}
          </button>
        </div>
        <div className="leave">
          <button onClick={leaveCall} type="button">
            <Leave /> Leave call
          </button>
        </div>
      </div>
    </div>
  );
}
