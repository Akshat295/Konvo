import React, { useEffect, useRef, useState } from "react";
// import "../styles/videoComponent.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";
import styles from "../styles/videoComponent.module.css";
import { Badge, IconButton } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEnd from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import ScreenShareStopIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router";
import background from "../assets/background.png";
import server from "../environment";

const server_url = server;

var connections = {}; // map of peerId -> RTCPeerConnection

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setShowModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);
  const { url: existingRoomId } = useParams();
  const DEFAULT_LOBBY_PATH = "a1b2c3d4";
  const [targetRoomId, setTargetRoomId] = useState(existingRoomId);
  const resolvedRoomId = targetRoomId || existingRoomId;

  useEffect(() => {
    if (!targetRoomId && existingRoomId) {
      setTargetRoomId(existingRoomId);
    }
  }, [existingRoomId, targetRoomId]);

  useEffect(() => {
    if (showModal) {
      setNewMessages(0);
    }
  }, [showModal]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
  // per-connection flags to track if we're currently creating an offer for that peer
  const makingOffer = useRef({});
  let routeTo = useNavigate();
  const navigate = useNavigate();

  const getPermissions = async () => {
    try {
      try {
        const videoPermission = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        setVideoAvailable(true);
      } catch (e) {
        setVideoAvailable(false);
      }

      try {
        const audioPermission = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setAudioAvailable(true);
      } catch (e) {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  let getUserMediaSuccuss = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    // IMPORTANT: Do NOT create offers here manually. Adding tracks will fire negotiationneeded
    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      try {
        connections[id].addStream(window.localStream);
      } catch (e) {
        // fallback: add tracks one by one
        try {
          window.localStream
            .getTracks()
            .forEach((track) =>
              connections[id].addTrack(track, window.localStream)
            );
        } catch (err) {
          console.log(err);
        }
      }
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          for (let id in connections) {
            try {
              connections[id].addStream(window.localStream);
            } catch (e) {
              try {
                window.localStream
                  .getTracks()
                  .forEach((track) =>
                    connections[id].addTrack(track, window.localStream)
                  );
              } catch (e) {
                console.log(e);
              }
            }
          }
        })
    );
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccuss)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (error) {
        console.log(error);
      }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  // ---------------- PERFECT NEGOTIATION: handle incoming signals ------------------
  let gotMessageFromServer = async (fromId, message) => {
    try {
      var signal = JSON.parse(message);
    } catch (e) {
      console.error("Invalid signal JSON", e);
      return;
    }

    if (fromId === socketIdRef.current) return;

    const pc = connections[fromId];
    if (!pc) {
      console.warn("No PC found for", fromId);
      return;
    }

    // polite flag assigned when PC was created
    const polite = pc.polite;

    // Handle SDP
    if (signal.sdp) {
      const desc = signal.sdp;
      const isOffer = desc.type === "offer";

      const offerCollision =
        isOffer &&
        (makingOffer.current[fromId] || pc.signalingState !== "stable");

      if (offerCollision && !polite) {
        // Impolite peer ignores the incoming offer when collision occurs
        console.warn(
          "Glare detected — impolite peer ignoring offer from",
          fromId
        );
        return;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(desc));
      } catch (err) {
        console.error("setRemoteDescription error:", err);
        return;
      }

      if (isOffer) {
        try {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ sdp: pc.localDescription })
          );
        } catch (err) {
          console.error("Error creating/sending answer:", err);
        }
      }
    }

    // Handle ICE
    if (signal.ice) {
      try {
        // If remoteDescription is not set yet, adding candidate may fail; catch silently
        await pc.addIceCandidate(new RTCIceCandidate(signal.ice));
      } catch (e) {
        // This can happen during glare; log for debugging but do not crash
        console.warn("addIceCandidate failed:", e);
      }
    }
  };
  // ---------------- END PERFECT NEGOTIATION ------------------

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current && !showModal) {
      setNewMessages((prevMessages) => prevMessages + 1);
    }
  };

  let connectToSocketServer = (roomKey) => {
    if (socketRef.current && socketRef.current.connected) return;

    const roomToJoin = roomKey || resolvedRoomId || DEFAULT_LOBBY_PATH;

    socketRef.current = io.connect(server_url, { secure: false });
    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", roomToJoin);
      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        // cleanup pc
        if (connections[id]) {
          try {
            connections[id].close();
          } catch (_) {}
          delete connections[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        // for each client (existing peer) ensure we have a PC
        clients.forEach((socketListId) => {
          if (socketListId === socketIdRef.current) return; // skip self

          // avoid recreating
          if (connections[socketListId]) return;

          // create pc
          const pc = new RTCPeerConnection(peerConfigConnections);

          // determine polite/impolite deterministically (Option A)
          // polite = true for whoever has the "higher" socket id (this is deterministic)
          pc.polite = socketListId > socketIdRef.current;

          // default makingOffer false for this peer
          makingOffer.current[socketListId] = false;

          // ICE candidate handler
          pc.onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // negotiationneeded handler (the correct place to create offers)
          pc.onnegotiationneeded = async () => {
            try {
              makingOffer.current[socketListId] = true;
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ sdp: pc.localDescription })
              );
            } catch (err) {
              console.error("onnegotiationneeded error:", err);
            } finally {
              makingOffer.current[socketListId] = false;
            }
          };

          // ontrack: modern handler (add remote streams)
          pc.ontrack = (event) => {
            // event.streams is usually present
            const remoteStream =
              event.streams && event.streams[0] ? event.streams[0] : null;
            if (remoteStream) {
              setVideos((previous) => {
                const exists = previous.some(
                  (v) => v.socketId === socketListId
                );
                if (exists) {
                  return previous.map((v) =>
                    v.socketId === socketListId
                      ? { ...v, stream: remoteStream }
                      : v
                  );
                }
                return [
                  ...previous,
                  {
                    socketId: socketListId,
                    stream: remoteStream,
                    autoPlay: true,
                    playsInline: true,
                  },
                ];
              });
            } else {
              // For track events without streams, create/append stream
              let newStream = new MediaStream();
              newStream.addTrack(event.track);
              setVideos((previous) => {
                const exists = previous.some(
                  (v) => v.socketId === socketListId
                );
                if (exists) {
                  return previous.map((v) =>
                    v.socketId === socketListId
                      ? { ...v, stream: newStream }
                      : v
                  );
                }
                return [
                  ...previous,
                  {
                    socketId: socketListId,
                    stream: newStream,
                    autoPlay: true,
                    playsInline: true,
                  },
                ];
              });
            }
          };

          // fallback for older onaddstream listener (you had this originally)
          pc.onaddstream = (event) => {
            setVideos((previous) => {
              const exists = previous.some((v) => v.socketId === socketListId);
              if (exists) {
                return previous.map((v) =>
                  v.socketId === socketListId
                    ? { ...v, stream: event.stream }
                    : v
                );
              }
              return [
                ...previous,
                {
                  socketId: socketListId,
                  stream: event.stream,
                  autoPlay: true,
                  playsInline: true,
                },
              ];
            });
          };

          connections[socketListId] = pc;

          // attach local stream if available (this will trigger negotiationneeded)
          if (window.localStream !== undefined && window.localStream !== null) {
            try {
              // prefer addTrack for modern API
              window.localStream
                .getTracks()
                .forEach((track) => pc.addTrack(track, window.localStream));
            } catch (e) {
              try {
                pc.addStream(window.localStream);
              } catch (_) {}
            }
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            try {
              window.localStream
                .getTracks()
                .forEach((track) => pc.addTrack(track, window.localStream));
            } catch (e) {
              try {
                pc.addStream(window.localStream);
              } catch (_) {}
            }
          }
        });

        // NOTE: previously you called createOffer for all connections here.
        // With Perfect Negotiation we rely on onnegotiationneeded, so we don't manually create offers here.
      });
    });
  };

  let getMedia = (roomKey) => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer(roomKey);
  };

  let connect = () => {
    if (!username.trim()) {
      return;
    }

    const normalizedUsername = username.toLowerCase().split(" ").join("-");
    const isLobbyRoute =
      !existingRoomId || existingRoomId === DEFAULT_LOBBY_PATH;
    const roomId = isLobbyRoute
      ? `${normalizedUsername}-${Date.now()}`
      : existingRoomId;

    setTargetRoomId(roomId);

    if (isLobbyRoute) {
      navigate(`/${roomId}`);
    }

    setAskForUsername(false);
    getMedia(roomId);
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let sendMessage = () => {
    if (!message.trim() || !socketRef.current) return;
    socketRef.current.emit("chat-message", message.trim(), username || "Guest");
    setMessage("");
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => [
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e)),
      ]);
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => {
            console.log(e);
            // Reset screen state when user cancels or denies permission
            setScreen(false);
          });
      }
    } else {
      // User clicked to stop screen sharing - switch back to camera
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log(e);
      }
      // Switch back to camera/mic
      getUserMedia();
    }
  };

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    routeTo("/home");
  };

  return (
    <div className={styles.meetingShell}>
      <div
        className={styles.meetingBackdrop}
        style={{ backgroundImage: `url(${background})` }}
      ></div>
      {askForUsername ? (
        <div className={styles.userEntry}>
          <div className={styles.lobbyPreview}>
            <video ref={localVideoRef} autoPlay muted></video>
            <span>Preview</span>
          </div>
          <div className={styles.lobby_content}>
            <h2>Ready to join?</h2>
            <p className={styles.lobbySubtitle}>
              Pick a display name and we’ll drop you into the call.
            </p>
            <div className={styles.input_row}>
              <input
                value={username}
                type="text"
                placeholder="Enter username"
                className="dark-input"
                onChange={(e) => setUsername(e.target.value)}
              />

              <button className={styles.joinBtn} onClick={connect}>
                Join now
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetingContent}>
          <header className={styles.meetingHeader}>
            <div>
              <p className={styles.meetingTitle}>Konvo Meet</p>
              <p className={styles.meetingCode}>
                Meeting ID: {resolvedRoomId || "Generating..."}
              </p>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.participantChip}>
                {videos.length + 1} in call
              </span>
              <Badge badgeContent={newMessages} max={99} color="secondary">
                <IconButton
                  onClick={() => setShowModal(!showModal)}
                  className={styles.secondaryAction}
                >
                  <ChatIcon />
                </IconButton>
              </Badge>
            </div>
          </header>

          <section className={styles.stageArea}>
            <div className={styles.videoGrid}>
              <div className={styles.videoTile} key="local">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.tileVideo}
                ></video>
                <span className={styles.videoLabel}>{username || "You"}</span>
              </div>
              {videos.length === 0 && (
                <div className={styles.placeholderTile}>
                  Waiting for others to join this meeting…
                </div>
              )}
              {videos.map((video) => (
                <div className={styles.videoTile} key={video.socketId}>
                  <video
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className={styles.tileVideo}
                  ></video>
                  <span className={styles.videoLabel}>
                    {video.socketId.slice(0, 6)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <aside
            className={`${styles.chatSidebar} ${
              showModal ? styles.chatSidebarOpen : ""
            }`}
          >
            <div className={styles.chatHeader}>
              <div>
                <h3>Meeting chat</h3>
                <p>Send messages to everyone on the call.</p>
              </div>
              <IconButton
                onClick={() => setShowModal(false)}
                className={styles.secondaryAction}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <div className={styles.chattingDisplay}>
              {messages.length > 0 ? (
                messages.map((item, index) => (
                  <div className={styles.chatBubble} key={index}>
                    <div className={styles.chatAuthor}>{item.sender}</div>
                    <div>{item.data}</div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>No messages yet</p>
              )}
            </div>
            <div className={styles.chattingArea}>
              <TextField
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message everyone"
                size="small"
                sx={{
                  flex: 1,
                  input: {
                    color: "white", // text color
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "#cccccc", // placeholder color
                    opacity: 1,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={!message.trim()}
              >
                Send
              </Button>
            </div>
          </aside>

          <div className={styles.controlDock}>
            <IconButton onClick={handleAudio}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton onClick={handleVideo}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            {screenAvailable ? (
              <IconButton onClick={handleScreen}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <ScreenShareStopIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}
            <IconButton onClick={handleEndCall} className={styles.endCall}>
              <CallEnd />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
