import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../App.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <img src="logo.jpg" alt="Konvo Logo" />
        </div>

        <div className="navlist">

          {/* JOIN AS GUEST */}
          

          {/* REGISTER */}
          <p
            className="navItemClickable"
            onClick={() => navigate("/auth")}
          >
            Register
          </p>

          {/* LOGIN */}
          <div
            className="navItemClickable"
            role="button"
            onClick={() => navigate("/auth")}
          >
            <p>Login</p>
          </div>

        </div>
      </nav>

      <div className="landingMainContainer">
        <h1 className="name">Konvo</h1>
        <p className="text">Connect. Collaborate. Converse.</p>

        <div className="start_btn">
          <button 
            type="button" 
            className="btn btn-outline-light"
            onClick={() => navigate("/a1b2c3d4")}
          >
            Join as guest
          </button>
        </div>
      </div>
    </div>
  );
}
