import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';
import background from "../assets/background.png";


function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    let handleJoinVideoCall = async () => {
        // await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    };

    return (
        <>
        <div
                style={{
                  backgroundImage: `url(${background})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "100%",
                  height: "100%",
                  filter: "blur(8px)",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: -1,
                }}
              ></div>
            <div className="dark-navbar">
          <img src="logo.jpg" alt="Konvo Logo" />

                <div className="nav-actions">
                    {/* <button className="nav-btn" onClick={() => navigate("/history")}>
                        History
                    </button> */}

                    <button className="logout-btn" onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/auth");
                    }}>
                        Logout
                    </button>
                </div>
            </div>

            <div className="dark-meet-container">
                <div className="dark-left-panel">
                    <h2 className="main-heading">
                        Providing Quality <span className="blue">Video Calling</span>
                    </h2>

                    <div className="input-row">
                        <input
                            type="text"
                            placeholder="Enter Meeting Code"
                            className="dark-input"
                            onChange={(e) => setMeetingCode(e.target.value)}
                        />

                        <button className="join-btn" onClick={handleJoinVideoCall} style={{backgroundColor: "#e8e892"}}>
                            Join
                        </button>
                    </div>
                </div>

                <div className="dark-right-panel">
                    <img src="/logo3.jpg" alt="Video Call" className="hero-img"/>
                </div>
            </div>
        </>
    );
}

export default withAuth(HomeComponent);
