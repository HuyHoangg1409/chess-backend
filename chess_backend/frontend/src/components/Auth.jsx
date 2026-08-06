import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

export default function Auth({onLoginSuccess}) {
  const [isRegistering, setIsRegistering] = useState(false);

  return isRegistering ? (
    <Register switchToLogin={()=> setIsRegistering(false)} />
  ) : (
    <Login switchToRegister={()=> setIsRegistering(true)} onLoginSuccess={onLoginSuccess}/>
  );
}
