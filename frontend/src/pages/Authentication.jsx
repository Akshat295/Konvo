import * as React from "react";
import {
  Avatar,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Typography,
  Snackbar,
  Paper,
  useMediaQuery,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { AuthContext } from "../contexts/AuthContext";
import background from "../assets/background.png";
import { useNavigate } from "react-router";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0); // 0=Login, 1=Signup
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);
  const navigate = useNavigate();

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width:480px)");
  const isTablet = useMediaQuery("(max-width:768px)");

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        let result = await handleLogin(username, password);
        if (result === "Login successful") {
          navigate("/home");
          setMessage(result);
        } else {
          setError(result);
        }
      } else {
        let result = await handleRegister(name, username, password);
        if (result === "User registered successfully") {
          navigate("/home");
          setMessage(result);
        } else {
          setError(result);
        }
      }
      setOpen(true);
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "auto",
      }}
    >
      {/* Blurred Background */}
      <div
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          width: "100%",
          height: "100%",
          filter: "blur(8px)",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      ></div>

      {/* Foreground */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        padding={isMobile ? "16px" : isTablet ? "24px" : "32px"}
      >
        <Paper
          elevation={6}
          sx={{
            padding: isMobile ? "1.5rem 1.25rem" : isTablet ? "2rem 2.5rem" : "3rem 4rem",
            width: isMobile ? "100%" : isTablet ? 380 : 420,
            maxWidth: "100%",
            borderRadius: isMobile ? "16px" : "20px",
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            color: "#fff",
          }}
        >
          {/* Lock Icon */}
          <Box display="flex" justifyContent="center" mb={isMobile ? 1.5 : 2}>
            <Avatar sx={{ bgcolor: "black", width: isMobile ? 36 : 40, height: isMobile ? 36 : 40 }}>
              <LockOutlinedIcon sx={{ fontSize: isMobile ? 20 : 24 }} />
            </Avatar>
          </Box>

          {/* Tabs */}
          <Tabs
            value={formState}
            onChange={(e, val) => setFormState(val)}
            centered
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: "#1b2025ff" },
            }}
            sx={{
              "& .MuiTab-root": {
                fontSize: isMobile ? "0.8rem" : "0.875rem",
                minWidth: isMobile ? 80 : 90,
                padding: isMobile ? "8px 12px" : "12px 16px",
              },
            }}
          >
            <Tab label="SIGN IN" />
            <Tab label="SIGN UP" />
          </Tabs>

          {/* Form Fields */}
          <Box mt={isMobile ? 2 : 3}>
            {formState === 1 && (
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                margin="normal"
                size={isMobile ? "small" : "medium"}
                onChange={(e) => setName(e.target.value)}
                InputLabelProps={{ style: { color: "#fff", fontSize: isMobile ? "0.9rem" : "1rem" } }}
                InputProps={{
                  style: { color: "#fff", background: "rgba(255,255,255,0.1)", fontSize: isMobile ? "0.9rem" : "1rem" },
                }}
              />
            )}

            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              size={isMobile ? "small" : "medium"}
              onChange={(e) => setUsername(e.target.value)}
              InputLabelProps={{ style: { color: "#fff", fontSize: isMobile ? "0.9rem" : "1rem" } }}
              InputProps={{
                style: { color: "#fff", background: "rgba(255,255,255,0.1)", fontSize: isMobile ? "0.9rem" : "1rem" },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              size={isMobile ? "small" : "medium"}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ style: { color: "#fff", fontSize: isMobile ? "0.9rem" : "1rem" } }}
              InputProps={{
                style: { color: "#fff", background: "rgba(255,255,255,0.1)", fontSize: isMobile ? "0.9rem" : "1rem" },
              }}
            />

            {/* Button */}
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ 
                mt: isMobile ? 2 : 3, 
                py: isMobile ? 0.8 : 1,
                fontSize: isMobile ? "0.85rem" : "0.9rem",
              }}
              onClick={handleAuth}
            >
              {formState === 0 ? "LOGIN" : "REGISTER"}
            </Button>
          </Box>

          {/* Snackbar */}
          <Snackbar
            open={open}
            autoHideDuration={3000}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={() => setOpen(false)}
              severity={error ? "error" : "success"}
              sx={{
                backgroundColor: error ? "#f44336" : "#4caf50",
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "0.5px",
                borderRadius: "8px",
              }}
            >
              {error || message}
            </Alert>
          </Snackbar>
        </Paper>
      </Box>
    </div>
  );
}
