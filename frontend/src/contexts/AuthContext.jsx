// import axios from "axios" ;
import { children, createContext, useContext, useState } from "react";
import { useNavigate } from "react-router";
import axios, { HttpStatusCode } from "axios";
export const AuthContext = createContext({});
import server from "../environment";

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);

  const [userData, setUserData] = useState(authContext);

  const handleRegister = async (name, username, password) => {
    try {
      console.log("Registering:", name, username, password);
      let request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      });
      console.log("Response:", request);

      if (
        request.status === HttpStatusCode.Created ||
        request.status === HttpStatusCode.Ok
      ) {
        // console.log(request.data.message);
        return "User registered successfully";
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", { username, password });

      if (request.status === HttpStatusCode.Ok) {
        localStorage.setItem("token", request.data.token);
        return "Login successful";
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === HttpStatusCode.NotFound) {
          return "User not found";
        } else if (err.response.status === HttpStatusCode.Unauthorized) {
          return "Invalid username or password";
        } else {
          return "Something went wrong";
        }
      } else {
        return "Network error";
      }
    }
  };

  const router = useNavigate();

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
